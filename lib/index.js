
/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var Track = require('segmentio-facade').Track;
var loadScript = require('@segment/load-script');

/**
 * Expose `Oiq` integration.
 *
 */
var Oiq = module.exports = integration('Oiq')
  .global('_oiqq')
  .option('dataGroupId','')
  .option('analyticTagId','')
  .option('conversionTagId','')
  .tag('<script src="https://www.fullstory.com/s/fs.js"></script>');

/**
 * Initialize.
 */

Oiq.prototype.initialize = function() {
  var self = this;
  window._oiqq = window._oiqq || [];
  self.ready();
  self.load();
};

/**
 * Loaded?
 *
 * @return {Boolean}
 */
Oiq.prototype.loaded = function() {
  return !!window._oiqq;
};

Oiq.prototype.page = function() {
  var opts = this.options;
  window._oiqq = window._oiqq || [];
  window._oiqq.push(['oiq_addPageLifecycle', opts.analyticTagId]);
  window._oiqq.push(['oiq_doTag']);
  var self = this;
  loadScript({
    http:'http://px.owneriq.net/stas/s/'+opts.dataGroupId+'.js',
    https:'https://px.owneriq.net/stas/s/'+opts.dataGroupId+'.js'
  }, function(err) {
    self.debug('error loading "%s" error="%s"', self.name, err);
  });
};

Oiq.prototype.track = function(track) {
  var isConversion = track.isConversion();
  var self = this;
  var opts = this.options;
  if (isConversion) {
    var title=document&&document.title||'Default Conversion - do not edit';
    var total = track.total() || track.revenue() || 0;
    var tax = track.tax() || 0;
    var orderId = track.orderId();
    var products = track.products();
    var email = track.email();
    var customerId = track.username();

    // orderId is required.
    if (!orderId) return;

    var totalQuantity=0;
    for (var i=0; i<products.length; i++) {
      var product=products[i];
      var index=i+1;
      var productTrack = createProductTrack(track, product);
      window._oiqq.push(['oiq_addPageLifecycle', opts.tagId]);
      window._oiqq.push(['oiq_addCustomKVP',['brand_'+index,productTrack.brand()]]);
      // window._oiqq.push(['oiq_addCustomKVP',['google_product_category_'+index,'value']]);
      // window._oiqq.push(['oiq_addCustomKVP',['gtin_'+index,'value']]);
      window._oiqq.push(['oiq_addCustomKVP',['id_'+index,productTrack.sku()]]);
      window._oiqq.push(['oiq_addCustomKVP',['price_'+index,productTrack.price()]]);
      window._oiqq.push(['oiq_addCustomKVP',['product_type_'+index,productTrack.category()]]);
      window._oiqq.push(['oiq_addCustomKVP',['quantity_'+index,productTrack.quantity()]]);
      window._oiqq.push(['oiq_addCustomKVP',['title_'+index,productTrack.name()]]);
      totalQuantity += productTrack.quantity()||0;
    }
    window._oiqq.push(['oiq_addCustomKVP',['order_id',orderId]]);
    // window._oiqq.push(['oiq_addCustomKVP',['cc_type','value']]);
    window._oiqq.push(['oiq_addCustomKVP',['customer_id',customerId]]);
    window._oiqq.push(['oiq_addCustomKVP',['email',email]]);
    window._oiqq.push(['oiq_addCustomKVP',['total_cost_notax',total]]);
    window._oiqq.push(['oiq_addCustomKVP',['total_cost_tax',total+tax]]);
    window._oiqq.push(['oiq_addCustomKVP',['total_quantity',totalQuantity]]);
    window._oiqq.push(['oiq_doTag']);


    loadScript('https://px.owneriq.net/stas/s/'+opts.dataGroupId+'.js', function(err) {
      self.debug('error loading "%s" error="%s"', self.name, err);
    });
    loadScript('https://px.owneriq.net/j?pt='+opts.dataGroupId+'&s='+opts.conversionTagId+'&sConvTitle='+title+'&cnv=true', function(err) {
      self.debug('error loading "%s" error="%s"', self.name, err);
    });
  } else {
    window._oiqq = window._oiqq || [];
    window._oiqq.push(['oiq_addPageLifecycle', opts.analyticDataGroupId]);
    window._oiqq.push(['oiq_doTag']);

    loadScript({
      http:'http://px.owneriq.net/stas/s/'+opts.dataGroupId+'.js',
      https:'https://px.owneriq.net/stas/s/'+opts.dataGroupId+'.js'
    }, function(err) {
      self.debug('error loading "%s" error="%s"', self.name, err);
    });
  }
};

/**
 * Creates a track out of product properties.
 *
 * @api private
 * @param {Track} track
 * @param {Object} properties
 * @return {Track}
 */

function createProductTrack(track, properties) {
  properties.currency = properties.currency || track.currency();
  return new Track({ properties: properties });
}