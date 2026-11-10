(function(root){
  'use strict';
  const STORAGE_KEY='sector7.campaign.save';
  const SAVE_VERSION=1;
  function defaults(){
    return {
      version:SAVE_VERSION,
      campaign:{unlockedMission:1,completedMissions:[]},
      stats:{runs:0,wins:0,losses:0,totalKills:0,bestKills:0}
    };
  }
  function finiteNonNegative(value){
    return Number.isFinite(value)&&value>=0?Math.floor(value):0;
  }
  class S7SaveSystem{
    constructor(storage,key){
      this.key=key||STORAGE_KEY;
      this.storage=storage||null;
      if(!this.storage){
        try{if(typeof localStorage!=='undefined')this.storage=localStorage}catch(e){}
      }
      this.data=defaults();
      this.loadStatus='empty';
    }
    load(){
      if(!this.storage||typeof this.storage.getItem!=='function'){
        this.data=defaults();this.loadStatus='unavailable';return this.getData();
      }
      let raw;
      try{raw=this.storage.getItem(this.key)}catch(e){
        this.data=defaults();this.loadStatus='unavailable';return this.getData();
      }
      if(!raw){this.data=defaults();this.loadStatus='empty';return this.getData()}
      try{
        const parsed=JSON.parse(raw);
        if(!parsed||parsed.version!==SAVE_VERSION)throw new Error('Unsupported save version');
        const clean=defaults();
        const campaign=parsed.campaign||{},stats=parsed.stats||{};
        clean.campaign.unlockedMission=Math.max(1,finiteNonNegative(campaign.unlockedMission));
        clean.campaign.completedMissions=Array.isArray(campaign.completedMissions)
          ?Array.from(new Set(campaign.completedMissions.filter(x=>typeof x==='string'&&x.length<=64))):[];
        for(const key of Object.keys(clean.stats))clean.stats[key]=finiteNonNegative(stats[key]);
        this.data=clean;this.loadStatus='loaded';
      }catch(e){
        this.data=defaults();this.loadStatus='recovered';
      }
      return this.getData();
    }
    save(){
      if(!this.storage||typeof this.storage.setItem!=='function')return false;
      try{this.storage.setItem(this.key,JSON.stringify(this.data));return true}
      catch(e){return false}
    }
    recordMissionResult(result){
      if(!result||typeof result.missionId!=='string'||!result.missionId)return this.getData();
      const kills=finiteNonNegative(result.kills);
      const won=!!result.won;
      this.data.stats.runs++;
      this.data.stats.totalKills+=kills;
      this.data.stats.bestKills=Math.max(this.data.stats.bestKills,kills);
      if(won){
        this.data.stats.wins++;
        if(!this.data.campaign.completedMissions.includes(result.missionId))
          this.data.campaign.completedMissions.push(result.missionId);
        const nextMissionOrder=Math.max(2,finiteNonNegative(result.nextMissionOrder));
        this.data.campaign.unlockedMission=Math.max(this.data.campaign.unlockedMission,nextMissionOrder);
      }else this.data.stats.losses++;
      this.save();
      return this.getData();
    }
    getData(){return JSON.parse(JSON.stringify(this.data))}
    reset(){this.data=defaults();return this.save()}
  }
  S7SaveSystem.VERSION=SAVE_VERSION;
  root.S7SaveSystem=S7SaveSystem;
  if(typeof module!=='undefined'&&module.exports)module.exports=S7SaveSystem;
})(typeof window!=='undefined'?window:globalThis);
