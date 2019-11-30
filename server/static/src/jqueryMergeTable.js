(function($, window, document) {
    function SummerizeTable(table) {
      $(table).each(function() {
        $(table).find('td').each(function() {
          var $this = $(this);
          var col = $this.index();
          var text = $.trim($this.text());//$this.html();
          var row = $(this).parent()[0].rowIndex; 
          var span = 1;
          var cell_above = $($this.parent().prev().children()[col]);

          // look for cells one above another with the same text
          while ($.trim(cell_above.text()) === text) { // if the text is the same
            span += 1; // increase the span
            cell_above_old = cell_above; // store this cell
            cell_above = $(cell_above.parent().prev().children()[col]); // and go to the next cell above
          }

          // if there are at least two columns with the same value, 
          // set a new span to the first and hide the other
          if (span > 1) {
            // console.log(span);
            $(cell_above_old).attr('rowspan', span);
            $this.hide();
          }

        });
      });
    }

    $.fn.mergeTable = function(options) {
        new SummerizeTable(this, options);
    }
})(jQuery, window, document);