/* Compiled by kdc on Sat Mar 22 2014 08:14:43 GMT+0000 (UTC) */
(function() {
/* KDAPP STARTS */
/* BLOCK STARTS: /home/joshumax/Applications/Githubdashboard.kdapp/app/settings.coffee */
var GitHub;

GitHub = {
  Settings: {
    baseViewClass: 'github-dashboard',
    appStorageName: 'github-dashboard',
    requestTimeout: 15000
  },
  Core: {
    Connector: null,
    CLI: null
  },
  Models: {
    Repo: null
  },
  Views: {
    RepoView: null,
    ReposView: null,
    MainView: null
  }
};
/* BLOCK STARTS: /home/joshumax/Applications/Githubdashboard.kdapp/app/core.coffee */
var Settings, nickname;

Settings = GitHub.Settings;

nickname = KD.whoami().profile.nickname;

GitHub.Core.Utils = (function() {
  function Utils() {}

  Utils.notify = function(message) {
    return new KDNotificationView({
      title: message
    });
  };

  return Utils;

})();

GitHub.Core.Storage = (function() {
  Storage.getSingleton = function() {
    return Storage.instance != null ? Storage.instance : Storage.instance = new Storage;
  };

  function Storage() {
    this.store = new AppStorage(Settings.appStorageName, "0.1");
  }

  Storage.prototype.set = function(key, value) {
    return this.store.setValue(key, value);
  };

  Storage.prototype.get = function(key, callback) {
    return this.store.fetchValue(key, callback);
  };

  return Storage;

}).call(this);

GitHub.Core.Connector = (function() {
  Connector.prototype.API_ROOT = "https://api.github.com";

  function Connector() {
    this.kite = KD.getSingleton("kiteController");
  }

  Connector.prototype.request = function(url, callback, params) {
    return this.kite.run("curl -kLss " + this.API_ROOT + url, function(error, data) {
      if (error || !data) {
        return $.ajax({
          url: "" + this.API_ROOT + url,
          data: params,
          dataType: "jsonp",
          success: callback
        });
      }
      try {
        data = JSON.parse(data);
      } catch (_error) {}
      return callback({
        data: data
      });
    });
  };

  Connector.prototype.getRepos = function(username, callback, page) {
    var _this = this;
    this.username = username;
    this.page = page != null ? page : 1;
    this.repos || (this.repos = []);
    return this.request("/users/" + username + "/repos", function(response) {
      var data, link, repo, _i, _len, _ref, _ref1, _ref2;
      _this.meta = response.meta, data = response.data;
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        repo = data[_i];
        _this.repos.push(repo);
      }
      link = (_ref = _this.meta) != null ? (_ref1 = _ref.Link) != null ? _ref1[0] : void 0 : void 0;
      if ((link != null ? (_ref2 = link[1]) != null ? _ref2.rel : void 0 : void 0) === "next") {
        return _this.getRepos(_this.username, callback, _this.page + 1);
      } else {
        if (typeof callback === "function") {
          callback(data != null ? data.message : void 0, _this.repos);
        }
        return _this.repos = [];
      }
    }, {
      page: this.page,
      per_page: 20
    });
  };

  Connector.prototype.readAppRepoOldManifest = function(appRepoName, callback) {
    var manifestFile;
    manifestFile = "https://raw.github.com/" + this.username + "/" + appRepoName + "/master/.manifest";
    return this.kite.run("curl -kLss " + manifestFile, function(error, data) {
      try {
        data = JSON.parse(data);
      } catch (_error) {}
      return callback(error, data);
    });
  };

  Connector.prototype.readAppRepoManifest = function(appRepoName, callback) {
    var manifestFile;
    manifestFile = "https://raw.github.com/" + this.username + "/" + appRepoName + "/master/manifest.json";
    return this.kite.run("curl -kLss " + manifestFile, function(error, data) {
      try {
        data = JSON.parse(data);
      } catch (_error) {}
      return callback(error, data);
    });
  };

  Connector.prototype.getAppRepoIconFullURL = function(appRepoName, callback) {
    var appBase,
      _this = this;
    appBase = "https://raw.github.com/" + this.username + "/" + appRepoName + "/master/";
    return this.readAppRepoManifest(appRepoName, function(error, manifest) {
      var iconPath, _ref;
      if (typeof manifest === "string") {
        error = true;
      }
      if (error || !manifest) {
        _this.readAppRepoOldManifest(appRepoName, function(error, manifest) {
          var iconPath, _ref;
          iconPath = manifest != null ? (_ref = manifest.icns) != null ? _ref["128"] : void 0 : void 0;
          return callback("" + appBase + iconPath, manifest);
        });
        return false;
      }
      iconPath = manifest != null ? (_ref = manifest.icns) != null ? _ref["128"] : void 0 : void 0;
      return callback("" + appBase + iconPath, manifest);
    });
  };

  return Connector;

})();

GitHub.Core.CLI = (function() {
  CLI.getSingleton = function() {
    return CLI.instance != null ? CLI.instance : CLI.instance = new CLI;
  };

  function CLI() {
    this.kite = KD.getSingleton("kiteController");
    this.finder = KD.getSingleton("finderController");
    this.vm = KD.getSingleton("vmController");
  }

  CLI.prototype.clone = function(url, name, callback) {
    var path, root,
      _this = this;
    root = "/home/" + nickname + "/GitHub";
    path = "" + root + "/" + name;
    return this.kite.run("mkdir -p " + path + "; git clone " + url + " " + path, function() {
      return callback.apply(_this, arguments);
    });
  };

  CLI.prototype.cloneAsApp = function(url, name, callback) {
    var path, root,
      _this = this;
    name = name.replace(/.kdapp$/, '');
    root = "/home/" + nickname + "/Applications";
    path = "" + root + "/" + name + ".kdapp";
    return this.kite.run("mkdir -p " + path + "; git clone " + url + " " + path + "; mv " + path + "/.manifest " + path + "/manifest.json", function() {
      KD.getSingleton('kodingAppsController').refreshApps();
      return callback.apply(_this, arguments);
    });
  };

  return CLI;

}).call(this);
/* BLOCK STARTS: /home/joshumax/Applications/Githubdashboard.kdapp/app/models.coffee */
var CLI;

CLI = GitHub.Core.CLI;

GitHub.Models.Repo = (function() {
  function Repo(model) {
    this.model = model;
    this.cli = CLI.getSingleton();
  }

  Repo.prototype.clone = function(callback) {
    return this.cli.clone(this.model.clone_url, this.model.name, callback);
  };

  Repo.prototype.cloneAsApp = function(callback) {
    var match, name;
    console.log(this.model.__koding_manifest.path);
    if (this.model.__koding_manifest.path) {
      match = this.model.__koding_manifest.path.match(/\/([^\/]*).kdapp\/?$/);
      if (match) {
        name = match[1];
      } else {
        name = this.model.name;
      }
    } else {
      name = this.model.name;
    }
    return this.cli.cloneAsApp(this.model.clone_url, name, callback);
  };

  return Repo;

})();
/* BLOCK STARTS: /home/joshumax/Applications/Githubdashboard.kdapp/app/views.coffee */
var CLI, Connector, Repo, Settings, Storage, killWait, notify, wait, _ref, _ref1,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Settings = GitHub.Settings;

_ref = GitHub.Core, Connector = _ref.Connector, Storage = _ref.Storage, CLI = _ref.CLI;

Repo = GitHub.Models.Repo;

notify = GitHub.Core.Utils.notify;

_ref1 = KD.utils, wait = _ref1.wait, killWait = _ref1.killWait;

GitHub.Views.RepoView = (function(_super) {
  __extends(RepoView, _super);

  function RepoView(options, data) {
    var _this = this;
    this.data = data;
    options.cssClass = "repo-item";
    RepoView.__super__.constructor.apply(this, arguments);
    this.storage = Storage.getSingleton();
    this.model = new Repo(this.data);
    this.action = this.data.fork ? "Forked" : "Developed";
    this.cloneButton = new KDButtonView({
      cssClass: "clean-gray clone",
      title: "Clone Repository",
      callback: function() {
        notify("Cloning the " + _this.data.name + " repository...");
        return _this.model.clone(function() {
          wait(300, function() {
            return notify("" + _this.data.name + " successfully cloned.");
          });
          return _this.pushClonedRepo(_this.data);
        });
      }
    });
  }

  RepoView.prototype.partial = function() {};

  RepoView.prototype.pistachio = function() {
    return "<span class=\"name\">" + this.data.name + "</span>\n<span class=\"owner\">" + this.action + " by <a href=\"http://github.com/" + this.data.owner.login + "\" target=\"_blank\">\n  " + this.data.owner.login + "</a></span>\n<div class=\"description\">" + this.data.description + "</div>\n<code class=\"clone-url\">$ git clone " + this.data.clone_url + "</code>\n{{> this.cloneButton}}";
  };

  RepoView.prototype.pushClonedRepo = function(repo) {
    var _this = this;
    return this.storage.get("repos", function(data) {
      data || (data = []);
      data.push(repo);
      return _this.storage.set("repos", data);
    });
  };

  RepoView.prototype.pushClonedAppRepo = function(repo) {
    var _this = this;
    return this.storage.get("appRepos", function(data) {
      data || (data = []);
      data.push(repo);
      return _this.storage.set("appRepos", data);
    });
  };

  RepoView.prototype.viewAppended = function() {
    return this.setTemplate(this.pistachio());
  };

  return RepoView;

})(KDListItemView);

GitHub.Views.AppRepoView = (function(_super) {
  __extends(AppRepoView, _super);

  function AppRepoView(options, data) {
    var _this = this;
    this.data = data;
    AppRepoView.__super__.constructor.apply(this, arguments);
    this.model = new Repo(this.data);
    this.installButton = new KDButtonView({
      cssClass: "cupid-green install",
      title: "Install Application",
      callback: function() {
        var warning;
        return warning = new KDModalView({
          title: "Security Warning",
          overlay: true,
          content: "<div class='modalformline'>\n  <p>\n    Installing apps from outside of Koding AppStore could be <strong>dangerous</strong>.\n    This app can reach (and modify) all of your files, settings and all other \n    information you shared with Koding. If you don't know what you are doing, \n    it's not <strong>recommended</strong> to install apps from outside of Koding AppStore.\n  </p>\n  <p>\n    Do you want to continue to install this app from " + _this.data.clone_url + "?\n  </p>\n</div>",
          buttons: {
            "Yes, I know the risks": {
              loader: {
                color: "#000",
                diameter: 16
              },
              style: "modal-clean-gray",
              callback: function() {
                notify("Installing " + _this.data.__koding_manifest.name + "...");
                return _this.model.cloneAsApp(function() {
                  wait(300, function() {
                    return notify("" + _this.data.__koding_manifest.name + " successfully installed.");
                  });
                  warning.destroy();
                  return _this.pushClonedAppRepo(_this.data);
                });
              }
            }
          }
        });
      }
    });
  }

  AppRepoView.prototype.pistachio = function() {
    return "<img src=\"" + this.data.__koding_icon + "\" width=\"128\" height=\"128\">\n<span class=\"name\">" + this.data.__koding_manifest.name + "</span>\n<span class=\"owner\">" + this.action + " by <a href=\"http://github.com/" + this.data.owner.login + "\" target=\"_blank\">\n  " + this.data.owner.login + "</a></span>\n<div class=\"description\">" + this.data.__koding_manifest.description + "</div>\n\n{{> this.installButton}}\n{{> this.cloneButton}}";
  };

  AppRepoView.prototype.viewAppended = function() {
    this.storage;
    return this.setTemplate(this.pistachio());
  };

  return AppRepoView;

})(GitHub.Views.RepoView);

GitHub.Views.ReposView = (function(_super) {
  __extends(ReposView, _super);

  ReposView.prototype.repos = [];

  function ReposView() {
    ReposView.__super__.constructor.apply(this, arguments);
  }

  ReposView.prototype.resetRepos = function(repos, data) {
    var _this = this;
    if (data == null) {
      data = {};
    }
    this.repos = [];
    this.replaceAllItems([]);
    $.each(repos, function(i, repo) {
      return _this.addRepo(repo, data);
    });
    return this.emit("ResetRepos", this.repos, data);
  };

  ReposView.prototype.addRepo = function(repo, data) {
    if (data == null) {
      data = {};
    }
    this.repos.push(repo);
    return this.emit("AddRepo", repo, data);
  };

  return ReposView;

})(KDListViewController);

GitHub.Views.MainView = (function(_super) {
  var AppRepoView, RepoView, ReposView, _ref2;

  __extends(MainView, _super);

  _ref2 = GitHub.Views, RepoView = _ref2.RepoView, AppRepoView = _ref2.AppRepoView, ReposView = _ref2.ReposView;

  function MainView() {
    MainView.__super__.constructor.apply(this, arguments);
    this.github = new Connector;
    this.storage = Storage.getSingleton();
  }

  MainView.prototype.getExistingRepos = function(callback) {
    var _this = this;
    return this.storage.get("appRepos", function(storedAppRepos) {
      if (storedAppRepos.length) {
        _this.appRepoList.resetRepos(storedAppRepos);
      }
      return _this.storage.get("repos", function(storedRepos) {
        if (storedRepos.length) {
          _this.repoList.resetRepos(storedRepos);
        }
        return wait(1200, function() {
          _this.placeholderView.hide();
          _this.containerView.show();
          if (callback) {
            return callback();
          }
        });
      });
    });
  };

  MainView.prototype.delegateElements = function() {
    var _this = this;
    this.placeholderView = new KDView({
      cssClass: "placeholder",
      partial: "Hey! Just search for someone with GitHub username!"
    });
    this.repoList = new ReposView({
      viewOptions: {
        itemClass: RepoView
      }
    });
    this.repoList.on("AddRepo", function(repo) {
      return _this.repoList.addItem(repo);
    });
    this.repoList.on("ResetRepos", function(repos, _arg) {
      var username;
      username = _arg.username;
      if (username) {
        if (!repos.length) {
          return notify("User " + username + " has no repository. :(");
        }
      }
    });
    this.appRepoList = new ReposView({
      viewOptions: {
        itemClass: AppRepoView
      }
    });
    this.appRepoList.on("AddRepo", function(repo) {
      return _this.appRepoList.addItem(repo);
    });
    this.theField = new KDInputView({
      enterKeyEnabled: true,
      type: "text",
      cssClass: "username text",
      placeholder: "Write a GitHub username or a repository URL to get started.",
      validate: {
        event: "keyup",
        rules: {
          required: true
        }
      }
    });
    this.theField.on("keyup", function(event) {
      if (event.keyCode === 13) {
        return _this.usernameButton.$().click();
      }
    });
    this.theField.on("ValidationError", function() {
      _this.cloneUrlButton.disable();
      return _this.usernameButton.disable();
    });
    this.theField.on("ValidationPassed", function() {
      _this.cloneUrlButton.enable();
      return _this.usernameButton.enable();
    });
    this.usernameButton = new KDButtonView({
      cssClass: "clean-gray username-button",
      title: "Get User Repositories",
      loader: {
        color: "#000",
        diameter: 16
      },
      callback: function() {
        var repoName, username, _ref3;
        _ref3 = _this.theField.getValue().split("/"), username = _ref3[0], repoName = _ref3[1];
        _this.appRepoList.replaceAllItems([]);
        _this.repoList.replaceAllItems([]);
        _this.placeholderView.show();
        console.log(_this.placeholderView);
        _this.github.getRepos(username, function(error, repos) {
          var _appRepos, _repos;
          _repos = [];
          _appRepos = [];
          if (error) {
            _this.usernameButton.hideLoader();
            killWait(_this.timeoutListener);
            return notify(error);
          }
          $.each(repos, function(i, repo) {
            if (repoName && repo.name !== repoName) {
              _this.appRepoList.resetRepos([], {
                username: username
              });
              return;
            }
            if (repo.name.match(/.kdapp$/)) {
              return _this.github.getAppRepoIconFullURL(repo.name, function(icon, manifest) {
                repo.__koding_icon = icon;
                repo.__koding_manifest = manifest;
                _appRepos.push(repo);
                return _this.appRepoList.resetRepos(_appRepos, {
                  username: username
                });
              });
            } else {
              return _repos.push(repo);
            }
          });
          _this.repoList.resetRepos(_repos, {
            username: username
          });
          wait(1200, function() {
            _this.usernameButton.hideLoader();
            _this.placeholderView.hide();
            return _this.containerView.show();
          });
          return killWait(_this.timeoutListener);
        });
        return _this.timeoutListener = wait(Settings.requestTimeout, function() {
          notify("Something wrong...");
          return _this.usernameButton.hideLoader();
        });
      }
    });
    this.dashboardButton = new KDButtonView({
      cssClass: "clean-gray cloneurl-button",
      title: "Dashboard",
      loader: {
        color: "#000",
        diameter: 16
      },
      callback: function() {
        return _this.getExistingRepos(function() {
          return _this.dashboardButton.hideLoader();
        });
      }
    });
    this.cloneUrlButton = new KDButtonView({
      cssClass: "clean-gray cloneurl-button",
      title: "Clone Repository URL",
      callback: function() {
        var cli, modal, repoName, repoPath, repoUrl, repoUser, _ref3;
        cli = CLI.getSingleton();
        repoPath = _this.theField.getValue();
        repoUrl = repoPath.replace(/(https?:\/\/)?github.com\/(.*)\/(.*)/, "$2/$3");
        _ref3 = repoUrl.split("/"), repoUser = _ref3[0], repoName = _ref3[1];
        if (!(repoUser && repoName)) {
          notify("This is not a clone URL, sorry. :(");
          return;
        }
        return modal = new KDModalViewWithForms({
          title: "Clone Repository URL",
          content: "<div class='modalformline'>Please write a name to clone the repository.</div>",
          overlay: true,
          tabs: {
            forms: {
              form: {
                fields: {
                  "User": {
                    label: "Repository",
                    name: "repoUrl",
                    defaultValue: "https://github.com/" + repoUrl,
                    disabled: true
                  },
                  "Root": {
                    label: "Clone Root",
                    name: "root",
                    defaultValue: "/Users/" + nickname + "/GitHub/",
                    disabled: true
                  },
                  "Path": {
                    label: "Clone Path",
                    name: "root",
                    defaultValue: "" + repoName
                  }
                },
                buttons: {
                  "Clone the Repository": {
                    loader: {
                      color: "#000",
                      diameter: 16
                    },
                    style: "modal-clean-gray",
                    callback: function() {
                      var clonePath, cloneUrl;
                      notify("Cloning " + repoName + " repository.");
                      cloneUrl = "https://github.com/" + repoUrl;
                      clonePath = modal.modalTabs.forms.form.inputs.Path.getValue();
                      return cli.clone(cloneUrl, clonePath, function() {
                        notify("Cloned " + repoName + " repository successfully!");
                        modal.modalTabs.forms.form.buttons["Clone the Repository"].hideLoader();
                        return modal.destroy();
                      });
                    }
                  }
                }
              }
            }
          }
        });
      }
    });
    this.cloneUrlButton.disable();
    this.usernameButton.disable();
    this.appRepoListView = new KDView({
      cssClass: 'app-repo-list'
    });
    this.appRepoListView.addSubView(this.appRepoList.getView());
    this.repoListView = new KDView({
      cssClass: 'repo-list'
    });
    this.repoListView.addSubView(this.repoList.getView());
    this.containerView = new KDView({
      cssClass: 'repos'
    });
    this.containerView.hide();
    this.containerView.addSubView(this.appRepoListView);
    return this.containerView.addSubView(this.repoListView);
  };

  MainView.prototype.pistachio = function() {
    return "<div class=\"scrollfade\"></div>\n<div class=\"main-view\">\n  <header>\n    <figure></figure>\n    {{> this.theField}}\n    {{> this.usernameButton}}\n    {{> this.cloneUrlButton}}\n  </header>\n  {{> this.containerView}}\n  {{> this.placeholderView}}\n</div>";
  };

  MainView.prototype.viewAppended = function() {
    this.delegateElements();
    return this.setTemplate(this.pistachio());
  };

  return MainView;

})(JView);
/* BLOCK STARTS: /home/joshumax/Applications/Githubdashboard.kdapp/index.coffee */
var GithubdashboardController, GithubdashboardMainView, MainView, Settings, notify,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Settings = GitHub.Settings;

MainView = GitHub.Views.MainView;

notify = GitHub.Core.Utils.notify;

GithubdashboardMainView = (function(_super) {
  __extends(GithubdashboardMainView, _super);

  function GithubdashboardMainView(options, data) {
    if (options == null) {
      options = {};
    }
    options.cssClass = 'githubdashbaord main-view';
    GithubdashboardMainView.__super__.constructor.call(this, options, data);
  }

  return GithubdashboardMainView;

})(KDView);

GithubdashboardController = (function(_super) {
  __extends(GithubdashboardController, _super);

  function GithubdashboardController(options, data) {
    if (options == null) {
      options = {};
    }
    options.view = new MainView;
    options.appInfo = {
      name: "Github Dashboard",
      type: "application"
    };
    GithubdashboardController.__super__.constructor.call(this, options, data);
  }

  return GithubdashboardController;

})(AppController);

(function() {
  var view;
  if (typeof appView !== "undefined" && appView !== null) {
    view = new MainView;
    return appView.addSubView(view);
  } else {
    return KD.registerAppClass(GithubdashboardController, {
      name: "Github Dashboard",
      routes: {
        "/:name?/Githubdashboard": null,
        "/:name?/joshumax/Apps/Githubdashboard": null
      },
      dockPath: "/joshumax/Apps/Githubdashboard",
      behavior: "application"
    });
  }
})();

/* KDAPP ENDS */
}).call();