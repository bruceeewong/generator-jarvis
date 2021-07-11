const Generator = require("yeoman-generator");
const Git = require("nodegit");
const chalk = require("chalk");
const rimraf = require("rimraf");
const _ = require("lodash");
_.extend(Generator.prototype, require("yeoman-generator/lib/actions/install"));
_.extend(Generator.prototype, require("yeoman-generator/lib/actions/user"));

class ChalkGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);
  }
  primary(...args) {
    return this.log(chalk.cyan(...args));
  }
  success(...args) {
    return this.log(chalk.green(...args));
  }
  error(...args) {
    return this.log(chalk.red(...args));
  }
  warning(...args) {
    return this.log(chalk.yellow(...args));
  }
  info(...args) {
    return this.log(chalk.gray(...args));
  }
}

module.exports = class JarvisGenerator extends ChalkGenerator {
  constructor(args, opts) {
    super(args, opts);
    this.GIT_USER = "bruceeewong";
    this.GIT_CLONE_TMP_DIR = ".tmp_git";
    this.TPL_TMP_DIR = ".tmp_tpl";
  }

  initializing() {
    this.primary("At your service, sir.");
    this.primary(
      "I can help you creating your project from template with just a few steps."
    );
    this.primary("Let's get started:");
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
        type: "input",
        name: "author",
        message: "May I know your name, please?",
        when: () => {
          return !this.git.name();
        },
        default: this.git.name(),
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
      {
        type: "confirm",
        name: "shouldNewDir",
        message: "Should I create a new directory here?",
        default: true,
      },
      {
        type: "confirm",
        name: "needInstall",
        message: "Should I install npm dependencies?",
        default: true,
      },
      {
        type: "list",
        name: "installBy",
        message: "Which package manager do you prefer",
        when: (answers) => answers.needInstall,
        choices: [
          {
            name: "npm",
            value: "npm",
          },
          {
            name: "yarn",
            value: "yarn",
          },
        ],
        default: "npm",
      },
    ]);
    this.answers = {
      ...answers,
      author: answers.author || this.git.name(),
    };
  }

  async writing() {
    if (!this.answers.repo) throw new Error("no template repo specified!");

    this._setDestination(this.answers.name, this.answers.shouldNewDir);
    await this._cloneFromGit();
    await this._handleTemplates();
    this._cleanAfterHandleTemplates();
  }

  install() {
    if (!this.answers.needInstall) return;
    this._installDependencies(this.answers.installBy);
  }

  end() {
    this.info("I've finished all set-ups, sir.");
    this.info("You can find your project at: " + this.destinationRoot());
    this.primary("Happy hacking ;)");
  }

  _setDestination(dir, shouldNewDir = true) {
    if (shouldNewDir && dir) {
      const newRoot = this.destinationPath(dir);
      this.destinationRoot(newRoot);
      return newRoot;
    } else {
      return this.destinationRoot();
    }
  }

  async _cloneFromGit() {
    try {
      this.info("start git cloning...");
      // git clone templates to tmp dir
      await JarvisGenerator.gitClone(
        { user: this.GIT_USER, repo: this.answers.repo },
        this.destinationPath(this.GIT_CLONE_TMP_DIR)
      );
      this.success("git clone finished");
    } catch (e) {
      this.error("git clone failed: " + e.message);
      throw e;
    }
  }

  async _handleTemplates() {
    this.info("handling templates...");
    return new Promise((resolve) => {
      this.fs.copyTpl(
        this.destinationPath(this.GIT_CLONE_TMP_DIR),
        this.destinationPath(this.TPL_TMP_DIR),
        {
          name: this.answers.name,
          author: this.answers.author,
        },
        {},
        {
          globOptions: { dot: true },
        }
      );
      this.fs.commit(() => resolve());
    })
      .then(() => {
        return new Promise((resolve) => {
          this.fs.move(
            this.destinationPath(this.TPL_TMP_DIR),
            this.destinationRoot(),
            {
              globOptions: { dot: true },
            }
          );
          this.fs.commit(() => resolve());
        });
      })
      .then(() => {
        this.success("copy template files finished");
      })
      .catch((e) => {
        this.error("copy template files failed:  " + e.message);
        throw e;
      });
  }
  async _cleanAfterHandleTemplates() {
    const needCleanDirList = [
      this.destinationPath(this.GIT_CLONE_TMP_DIR),
      this.destinationPath(this.TPL_TMP_DIR),
      this.destinationPath(".git"),
    ];

    const cleanTasks = needCleanDirList.map((dir) => {
      return new Promise((resolve, reject) => {
        rimraf(dir, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });

    this.info("cleaning...");
    return Promise.all(cleanTasks)
      .then(() => this.success("clean finished"))
      .catch((e) => {
        this.error("clean files failed:  " + e.message);
        throw e;
      });
  }

  _installDependencies(installBy = "npm") {
    if (installBy === "yarn") {
      this.yarnInstall();
    } else {
      this.npmInstall();
    }
  }

  static gitClone(info, destination) {
    const { user, repo } = info;
    if (!user || !repo) throw new Error("username and repo are required");
    const url = `https://github.com/${user}/${repo}`;
    return Git.Clone(url, destination);
  }
};
