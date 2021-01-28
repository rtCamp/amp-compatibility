$(function () {
    /* drop down function */
    $(document).on('click', '.dropdown-item', function(e){
        var tt = $(this).parents('.dropdown').find('button');
        tt.text($(this).text());
    });

    /* auto complete for theme */
	$( "#theme" ).autocomplete({
        source: "/api/v1/list-themes",
		minLength: 3
	});

    /* auto complete for plugin */
	$( "#plugins input" ).autocomplete({
        source: "/api/v1/list-plugins",
		minLength: 3
	});

    var removeButton = `<div class="input-group-append">
                <button class="btn btn-outline-danger remove">
                -
                </button>
                </div>`;

    /* add another plugin  */
	$( '#plugins .add' ).on( 'click', function(){
		var inputGroup = $('#plugins .input-group:eq(0)').clone();
            inputGroup.find('.add').remove();
            inputGroup.find('input').val('');
            inputGroup.append(removeButton);
        $('#plugins').append( inputGroup );

            inputGroup.find('input:eq(0)').autocomplete({
            source: "/api/v1/list-plugins",
			minLength: 3
		});
    });

});