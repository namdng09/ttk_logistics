$(document).ready(function () {
  $(document).on('change', '#email', function (event) {
    $("#edit-name").val($("#email").val());
  });
  $(document).on('change', '#password', function (event) {
    $("#edit-pass").val($("#password").val());
  });

  $(document).on('click', '.btn-login', function (event) {
    event.preventDefault();

    $("#user-login").submit();
  });
  $("#error-username").text($(".form-item-name .description").text());
  $("#error-password").text($(".form-item-pass .description").text());
  
  $("#email").val($("#edit-name").val());
  $("#password").val($("#edit-pass").val());
})
