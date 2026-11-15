/** Shared by the compact house and the advanced settings view. */
export async function connectBrain(config:{provider:string;model:string;endpoint:string;tools:boolean;key:string}){
 const {provider,endpoint,tools}=config,model=config.model.trim();
 if(!model)throw Error('请填写模型 ID');
 if(config.key.trim())await window.garden.saveKey(provider,config.key.trim());
 const result=await window.garden.testConnection(provider,model,endpoint);
 await window.garden.dispatch({type:'connection',provider,profile:{model,endpoint,tools}});
 await window.garden.dispatch({type:'settings',patch:{provider,model,mode:'api'}});
 return result;
}
