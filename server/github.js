Github = {
  updateLastWeekCommits : function(name){

    //Delete old
    RandomCenas.remove({commit: {$exists: true}});
    var d = new Date();
    d.setDate(d.getDate() - 7);

    var link = "https://api.github.com/repos/jeknowledge/" + name + "/commits";
    var arguments = {
      headers: {"User-Agent": "Meteor/1.0"},
      params: {
        "access_token": "b29eba401f2f0bd761e16d7507f0c413009cf2a8",
        "since": d.toISOString()
      }
    };

    HTTP.call('GET', link, arguments, function(error,response){
      var github = RandomCenas.findOne({api:"github"});
      for(var i = 0; i < response.data.length; i++){
        var c = response.data[i];
        var authorCommit=c.author.login; //Commit info
        RandomCenas.insert({
          api: "github",
          commit: {
            message: c.commit.message,
            date: Date.parse(c.commit.author.date),
            repo: name,
            user: c.author.login
          }
        });
        RandomCenas.update(github._id,{$inc:{lastCommitsnumb:1}});
      }
    });
  },
  updateRepoData : function(name, data){

    var github = RandomCenas.findOne({api:"github"});

    //Repo TotalCommits
    var new_commits, sum = 0;
    for(var i = 0; i < data.length; i++)
      sum += data[i].total;

    //Org TotalCommits
    new_commits = sum;
    if(github.repos[name])
      new_commits -= github.repos[name]

    //Update Repo Data
    github.repos[name] = sum
    //Save
    RandomCenas.update(github._id,{
      $set: {totalCommits: github.totalCommits + new_commits, repos: github.repos}
    });
  },
  checkRepo : function(name){

    var link = "https://api.github.com/repos/jeknowledge/" + name + "/stats/contributors";
    var arguments = {
      headers: {"User-Agent": "Meteor/1.0"},
      params: {"access_token": "b29eba401f2f0bd761e16d7507f0c413009cf2a8"}
    };


    HTTP.call('GET', link, arguments, function(error,response){
      var github = RandomCenas.findOne({api:"github"});

      //does it exist in our db? Or has it changed?
      if(!github.repos[name] || github.repos[name] != response.data.total)
        Github.updateRepoData(name.valueOf(), response.data);

    });
  },
  getRepoList : function(){

    var link = "https://api.github.com/orgs/jeknowledge/repos";
    var arguments = {
      headers: {"User-Agent": "Meteor/1.0"},
      params: {"access_token": "b29eba401f2f0bd761e16d7507f0c413009cf2a8"}
    };
    RandomCenas.update(RandomCenas.findOne({api:"github"})._id,{$set:{lastCommitsnumb:0}});
    //RandomCenas.update(RandomCenas.findOne({api:"github"})._id,{$set:{pessoas:{}}});
    HTTP.call('GET', link, arguments, function(error,response){
      for(var i = 0; i < response.data.length; i++){
        Github.checkRepo(response.data[i].name);
        Github.updateLastWeekCommits(response.data[i].name);
      }
      });
  }

};
