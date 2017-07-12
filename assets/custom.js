(function ($) {
  $.fn.serializeFormJSON = function () {

    var o = {};
    var a = this.serializeArray();
    $.each(a, function () {
      if (o[this.name]) {
        if (!o[this.name].push) {
          o[this.name] = [o[this.name]];
        }
        o[this.name].push(this.value || '');
      } else {
        o[this.name] = this.value || '';
      }
    });
    return o;
  };
})(jQuery);

$(document).ready(function() {

  $('#order-cta').click(function(event) {
    $(this).hide(100);
    $('#order-desc').show();
  });

  $("#make-order").submit(function(event) {
    event.preventDefault();

    var data = $(this).serializeFormJSON();

    if (
      !data.budget
    ) {
      alert('Please add description and estimate your budget');
      return false;
    }

    $.ajax({
      url: $(this).attr('action'),
      data: $(this).serialize(),
      method: 'POST',
      success: function(data) {
        $('#order-desc-thanks').show();
        $('#order-desc-form').hide();
      }
    });
  });

});
