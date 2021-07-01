const Generator = require("yeoman-generator");

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
  }

  async prompting() {
    const answers = await this.prompt([
      {
        type: "input",
        name: "name",
        message: "Your project name",
        default: this.appname,
      },
      {
        type: "confirm",
        name: "cool",
        message: "Would you like to enable the Cool feature?",
      },
    ]);
    this.log("app name", answers.name);
    this.log("cool feature", answers.cool);
  }

  writing() {
    // this.log("cool feature", this.answers.cool);
  }
};
