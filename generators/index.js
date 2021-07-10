const Generator = require("yeoman-generator");
const Git = require("nodegit");
module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
  }

  async prompting() {
    this.answers = await this.prompt([
      {
        type: "input",
        name: "name",
        message: "Your project name",
        default: this.appname,
      },
      {
        type: "list",
        name: "repo",
        message: "Select a template to start with",
        choices: [
          {
            name: "NodeJS template",
            value: "template-node-js",
          },
          {
            name: "NodeJS template with Typescript",
            value: "template-node-ts",
          },
          {
            name: "Gatsby template with Typescript",
            value: "template-gatsby-ts",
          },
        ],
      },
    ]);
  }

  _gitClone(info, destination) {
    const { user, repo } = info;
    if (!user || !repo) throw new Error("username and repo are required");
    const url = `https://github.com/${user}/${repo}`;
    return Git.Clone(url, destination);
  }

  async writing() {
    if (!this.answers.repo) throw new Error("no template repo specified!");

    try {
      await this._gitClone(
        { user: "bruceeewong", repo: this.answers.repo },
        this.destinationRoot()
      );
      this.log("git clone succeed:");
    } catch (e) {
      this.log("git clone failed: " + e.message);
    }
  }

  end() {
    this.log("happy hacking ;)");
  }
};
