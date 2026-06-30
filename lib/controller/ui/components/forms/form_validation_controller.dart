import 'package:flutter/material.dart';
import 'package:kho555/controller/my_controller.dart';
import 'package:kho555/helper/widgets/my_field_validator.dart';
import 'package:kho555/helper/widgets/my_form_validator.dart';
import 'package:kho555/helper/widgets/my_validators.dart';

class FormValidationController extends MyController {
  MyFormValidator basicValidator = MyFormValidator();

  FormValidationController() {
    basicValidator.addField('full_name', required: true, label: "Full Name", controller: TextEditingController());

    basicValidator.addField('email', required: true, label: "Email", validators: [MyEmailValidator()], controller: TextEditingController());

    basicValidator.addField('city', required: true, label: "City", validators: [MyCityValidator()], controller: TextEditingController());

    basicValidator.addField('state', required: true, label: "State", validators: [MyStateValidator()], controller: TextEditingController());

    basicValidator.addField(
      'password',
      required: true,
      label: "Password",
      validators: [MyLengthValidator(min: 6, max: 10)],
      controller: TextEditingController(),
    );

    basicValidator.addField('gender', required: true, label: "Gender", validators: [GenderValidator()]);
  }


  void onSubmitBasicForm() {
    basicValidator.validateForm();
  }

  void onResetBasicForm() {
    basicValidator.resetForm();
  }
}

class GenderValidator extends MyFieldValidatorRule<Gender> {
  @override
  String? validate(Gender? value, bool required, Map<String, dynamic> data) {
    return null;
  }
}

enum Gender {
  male,
  female,
  none;

  const Gender();
}
