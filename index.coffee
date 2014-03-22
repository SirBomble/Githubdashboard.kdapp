{Settings}  = GitHub
{MainView}  = GitHub.Views
{notify}    = GitHub.Core.Utils
    
class GithubdashboardMainView extends KDView

  constructor:(options = {}, data)->
    options.cssClass = 'githubdashbaord main-view'
    super options, data

class GithubdashboardController extends AppController

  constructor:(options = {}, data)->
    options.view    = new MainView
    options.appInfo =
      name : "Github Dashboard"
      type : "application"

    super options, data

do ->

  # In live mode you can add your App view to window's appView
  if appView?

    view = new MainView
    appView.addSubView view

  else

    KD.registerAppClass GithubdashboardController,
      name     : "Github Dashboard"
      routes   :
        "/:name?/Githubdashboard" : null
        "/:name?/joshumax/Apps/Githubdashboard" : null
      dockPath : "/joshumax/Apps/Githubdashboard"
      behavior : "application"