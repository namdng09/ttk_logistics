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

  $(document).on('keydown', '#formAuthentication input', function (event) {
    if (event.which === 13) {
      event.preventDefault();
      $("#edit-name").val($("#email").val());
      $("#edit-pass").val($("#password").val());
      $("#user-login").submit();
    }
  });
  $("#error-username").text($(".form-item-name .description").text());
  $("#error-password").text($(".form-item-pass .description").text());
  
  $("#email").val($("#edit-name").val());
  $("#password").val($("#edit-pass").val());
})
