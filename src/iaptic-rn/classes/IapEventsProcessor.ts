import * as IAP from 'react-native-iap';
import { IapticEvents } from './IapticEvents';
import { IapticRN } from '../IapticRN';
import { DebouncedProcessor } from './DebouncedProcessor';
import { IapticError, IapticErrorSeverity, toIapticError } from './IapticError';
import { EmitterSubscription } from 'react-native';
import { logger } from './IapticLogger';
import { globalsGet, globalsSet } from '../functions/globals';
import { IapticErrorCode } from '../types';
import { Locales } from './Locales';

/**
 * Process events from react-native-iap
 */
export class IapEventsProcessor {

  /**
   * react-native-iap sends many copies of events when doing hot reloads, we use the random id to identify the
   * instance of the object that catches the events for debugging purposes.
   */
  private id = randomId();

  /**
   * Those debounced processors to fix the issue of many copies of events when doing hot reloads,
   * and to ensure we process events a single time, in the background.
   */
  private purchaseProcessor = new DebouncedProcessor<IAP.SubscriptionPurchase | IAP.ProductPurchase>(p => this.processPurchase(p, true), p => p.transactionId ?? '');
  private errorProcessor = new DebouncedProcessor<IAP.PurchaseError>(e => this.processError(e), e => e.code ?? '');

  private onPurchaseUpdate?: EmitterSubscription;
  private onPurchaseError?: EmitterSubscription;

  purchases: Map<string, IAP.ProductPurchase | IAP.SubscriptionPurchase> = new Map();

  constructor(private readonly iaptic: IapticRN, private readonly events: IapticEvents) {
    globalsSet('active_iap_events_processor', this.id);
  }

  addListeners() {
    logger.info('addListeners');
    if (this.onPurchaseUpdate) return;
    this.onPurchaseUpdate = IAP.purchaseUpdatedListener(p => this.purchaseProcessor.add(p));
    this.onPurchaseError = IAP.purchaseErrorListener(e => this.errorProcessor.add(e));
  }

  removeListeners() {
    logger.info('removeListeners');
    this.onPurchaseUpdate?.remove();
    this.onPurchaseError?.remove();
    this.onPurchaseUpdate = this.onPurchaseError = undefined;
  }

  /**
   * - Triggers in real-time when a new purchase is made
   * - Only catches purchases that happen while the app is running
   * - Is the primary way to handle active purchase flows
   * - Won't catch purchases made on other devices or in previous installations
   */
  async processPurchase(purchase: IAP.SubscriptionPurchase | IAP.ProductPurchase, inBackground: boolean = false) {
    if (globalsGet('active_iap_events_processor') !== this.id) {
      return;
    }
    logger.info(`[${this.id}] Processing purchase: ${purchase.transactionId ?? purchase.productId} for product: ${purchase.productId} in background: ${inBackground}`);

    // Cache the purchase for 1 minute (so we can finish it later)
    this.purchases.set(purchase.transactionId ?? purchase.productId, purchase);
    setTimeout(() => {
      this.purchases.delete(purchase.transactionId ?? purchase.productId);
    }, 60000); // remove from cache after 1 minute

    const reportError = (err: any, severity: IapticErrorSeverity = IapticErrorSeverity.WARNING) => {
      if (inBackground) {
        this.events.emit('error', toIapticError(err, severity));
      }
      else {
        throw toIapticError(err, severity);
      }
    }

    // First validate the purchase with iaptic
    try {

      if (this.iaptic.pendingPurchases.getStatus(purchase.productId) === 'validating') {
        logger.info('🔄 Purchase is already being validated, waiting for status to change');
        while (true) {
          await new Promise(resolve => setTimeout(resolve, 100));
          if (this.iaptic.pendingPurchases.getStatus(purchase.productId) !== 'validating') {
            return this.iaptic.purchases.getPurchase(purchase.productId, purchase.transactionId);
          }
        }
      }

      this.iaptic.pendingPurchases.update(purchase.productId, 'validating');
      const verified = await this.iaptic.validate(purchase);
      logger.debug('processPurchase has validated the purchase (verified: ' + verified + ')');
      if (!verified) {
        // the receipt is valid, but transaction does not exist, let's finish it
        logger.debug('processPurchase is finishing the purchase');
        this.iaptic.pendingPurchases.update(purchase.productId, 'finishing');
        try {
          await IAP.finishTransaction({ purchase, isConsumable: this.iaptic.products.getType(purchase.productId) === 'consumable' });
        }
        catch (error: any) {
          logger.info('Failed to finish unverified purchase: ' + error + ' (this is fine, we tried)');
        }
        this.iaptic.pendingPurchases.update(purchase.productId, 'completed');
        return;
      }
    }
    catch (error: any) {
      reportError(error, IapticErrorSeverity.WARNING);
      return;
    }

    // Let's handle subscriptions
    switch (this.iaptic.products.getType(purchase.productId)) {
      case 'consumable':
        // We let the user consume the purchase
        break;
      case 'non consumable':
      case 'paid subscription':
        // Automatically finish the purchase for non-consumable and paid subscriptions
        // because iaptic has the status now
        logger.debug('processPurchase is finishing the purchase because it is a non-consumable or paid subscription');
        try {
          this.iaptic.pendingPurchases.update(purchase.productId, 'finishing');
          await IAP.finishTransaction({ purchase, isConsumable: this.iaptic.products.getType(purchase.productId) === 'consumable' });
        } catch (finishError: any) {
          logger.info('Failed to finish unverified purchase: ' + finishError.message);
          // reportError(finishError, IapticErrorSeverity.WARNING);
        }
        break;
    }

    logger.debug('processPurchase completed');
    this.iaptic.pendingPurchases.update(purchase.productId, 'completed');
  }

  private processError(error: IAP.PurchaseError) {
    if (globalsGet('active_iap_events_processor') !== this.id) {
      return;
    }
    logger.warn(`[${this.id}] IAP.PurchaseError #${this.id} #${error.code} - ${error.message}`);
  }
}

/** A random string */
function randomId() {
  return Math.random().toString(36).substring(4);
}