const core = require('@actions/core');
const { Octokit } = require('@octokit/core');
const { graphql } = require('@octokit/graphql');
// const https = require('https');
const COMMUNITY_OWNER = 'QualiSystems'
const COMMUNITY = 'CloudShell-Community';
// const COMMUNITY_OWNER = 'Quali-Community';
// const COMMUNITY = 'TestRepo';
const repoCatId = 'DIC_kwDOHwZ3p84CQk7b'; 
// const repoCatId = 'DIC_kwDOH62R-M4CTONe'; 
//SB REPOS : DIC_kwDOH62R-M4CTONe ~92 ////////////////// PR REPOS : DIC_kwDOHwZ3p84CQk7b

refresh();


async function refresh() {
  core.notice('ME, A SCHEDULED WORKFLOW ACTION');
  //~
  //   const getIntegDiscs_query = 
  // `

  let extracted=[];
  var entries = [];

//getTotalRepoDiscCount //SB REPOS : DIC_kwDOH62R-M4CTONe ~92 ////////////////// PR REPOS : DIC_kwDOHwZ3p84CQk7b
  await graphql(
    `query getTotalRepoDiscCount ($owner: String!, $name: String!, $categoryId: ID){
    repository(name: $name, owner: $owner) {
    discussions(categoryId: $categoryId) {
      totalCount
    }
  }
}`,{
    "name": COMMUNITY,
    "owner": COMMUNITY_OWNER,
    "categoryId": repoCatId, 
    headers: {authorization: `Bearer ${core.getInput('tkn')}`,},
    })
  .then(res=>{core.info(JSON.stringify(res));try{entryCount=res.repository.discussions.totalCount;}catch(e){core.error(e);}})
  .catch(err=>{core.error(err);});;
  
 entryCount=!entryCount?300:entryCount;
//get   
  let pages = parseInt(entryCount/100);///10);
  core.info('PAGES: '+pages);
  
  let firstPage = true, hasNextPage/*, startCursor*/, endCursor, totalRecords;
  
  
  do {
    let after = (firstPage)? {1:'',2:''} : {1:', $after: String',2:', after: $after'} ;
    let query_template = 
    `query QueryDiscussions($owner: String!, $name: String!, $categoryId: ID!, $first: Int! ${after[1]}) {
      repository(name: $name, owner: $owner) {
        discussions(categoryId: $categoryId, first: $first ${after[2]}, orderBy: {field: CREATED_AT, direction: ASC}) {
          pageInfo {
            hasNextPage
            endCursor
          }
          totalCount
          nodes {
            number
            body
          }
        }
      }
    }`
    ;
    let first = (entryCount>100)? 100 : entryCount;
    if (entryCount>100) entryCount-=100;
    
    core.info('first '+first);
    
//                                                             first=5;
    const query_variables_headers = {
      "name": COMMUNITY,//'CloudShell-Community',//COMMUNITY,
      "owner": COMMUNITY_OWNER,//'QualiSystems',//COMMUNITY_OWNER,
      "first": first,
      "categoryId": repoCatId,//'DIC_kwDOHwZ3p84CQk7b',//repoCatId,
      "after":(firstPage)?null:endCursor,
      headers: {authorization: `Bearer ${core.getInput('tkn')}`,},
    };
    

        await graphql(query_template,query_variables_headers)
          .then((res)=>{
                try{

                  core.info(`\nQUERY SUBMITTED!`);
        
          
            firstPage=false;
          // startCursor=response.res.repository.discussions.pageInfo.startCursor;
          endCursor=res.repository.discussions.pageInfo.endCursor;
          hasNextPage=res.repository.discussions.pageInfo.hasNextPage;
          totalRecords=res.repository.discussions.totalCount;
          
          core.info(`firstPage ${firstPage}, endCursor ${endCursor}, hasNextPage ${hasNextPage}, totalRecords ${totalRecords}`)
          
          
//           entries = res.repository.discussions.nodes;
          
          if (res.repository.discussions.nodes && res.repository.discussions.nodes.length > 0){
            try{
              res.repository.discussions.nodes.forEach(node=>{entries.push(node);});
            }catch(e_){core.warning(e_);} 
          }
          else core.error('NO ENTRIES');
          
      }catch(error){
        core.error(error);
          
      }
          
        })
          .catch(e=>{core.error(e);});
      
        
    
    pages--;
        let startTime = Date.now(); 
        let finishTime = Date.now(); 
        while ((finishTime - startTime) < 1000) 
          finishTime = Date.now();

  } while(hasNextPage && pages>0);
  
  if (entries){    core.notice('entries.length: '+entries.length);    }else{    core.error('entries.length: ERROR!');  }
    
  if (entries){
   entries.forEach((en,i)=>{
    var targetDisc= { ownerSlashRepo: undefined, number: undefined };
     try{
//                                                                       /**/if (i<5) core.info(en.number);
      if (en.body){ targetDisc.ownerSlashRepo = en.body.split('<sub><sup><a href=')[1].split(`?OR=`)[1].split(`&DN=`)[0];      }
      else{
       	if(en.body.includes('github.com/repos/')){
								// if ((owner_repo=repoDetails.split('github.com/repos/')[1].match(/(?:\w\/)?(\w*\/\w*)(?=\.|\/|\\"|<)/))!==null){
								  let owner_repo;
									if ((
								    owner_repo=en.body
								    .split('github.com/repos/')[1]
								    .match(/([-\w]*?\/[-\w]*?)(?=[\.\/\"\\\)\n\r])/)
								    )!==null){
								    if (owner_repo[1] && owner_repo[1].includes('/'))
								    //{ owner = owner_repo[1].split('/')[0]; repo = owner_repo[1].split('/')[1]; }
                    {targetDisc.ownerSlashRepo=`${owner_repo[1].split('/')[0]}/${owner_repo[1].split('/')[1]}`;}
								    else (owner_repo[0] && owner_repo[0].includes('/'))
								    //{ owner = owner_repo[0].split('/')[0]; repo = owner_repo[0].split('/')[1]; }
                    {targetDisc.ownerSlashRepo=`${owner_repo[0].split('/')[0]}/${owner_repo[0].split('/')[1]}`;}
								    core.notice(`${targetDisc.ownerSlashRepo}\niiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii\n`);
								  }
								}
	
	else if(en.body.includes('github.com/')){
								// if ((owner_repo=repoDetails.split('github.com/repos/')[1].match(/(?:\w\/)?(\w*\/\w*)(?=\.|\/|\\"|<)/))!==null){
								  let owner_repo;
									if ((
								    owner_repo=en.body
								    .split('github.com/')[1]
								    .match(/([-\w]*?\/[-\w]*?)(?=[\.\/\"\\\)\n\r])/)
								    )!==null){
								    if (owner_repo[1] && owner_repo[1].includes('/'))
								    //{ owner = owner_repo[1].split('/')[0]; repo = owner_repo[1].split('/')[1]; }
                    {targetDisc.ownerSlashRepo=`${owner_repo[1].split('/')[0]}/${owner_repo[1].split('/')[1]}`;}
								    else (owner_repo[0] && owner_repo[0].includes('/'))
								    //{ owner = owner_repo[0].split('/')[0]; repo = owner_repo[0].split('/')[1]; }
                    {targetDisc.ownerSlashRepo=`${owner_repo[0].split('/')[0]}/${owner_repo[0].split('/')[1]}`;}
								    core.notice(`${targetDisc.ownerSlashRepo}\niiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii\n`);
								  }
								}
								
       }//else
      if (en.number){ targetDisc.number = en.number };
      if (targetDisc.ownerSlashRepo!==undefined && targetDisc.ownerSlashRepo.includes(`/`) && targetDisc.number!==undefined){        extracted.push(targetDisc);      }
       
    }catch(e_){core.warning(e_);}
   }); 
  }
  
  if (extracted){  
    
    core.notice('extracted.length: '+extracted.length);  
//                                                                         /**/core.info(JSON.stringify(extracted));
    if (extracted.length>0){
      
      
      extracted.forEach((x,itr)=>{
                                                                
          let startTime = Date.now(); 
        let finishTime = Date.now(); 
        while ((finishTime - startTime) < 500) 
          finishTime = Date.now();
        
        
//         core.notice(`POSTING: ${x.ownerSlashRepo}, #${x.number}`);

        
        const octokit = new Octokit({
          auth: core.getInput('tkn')
        })

//         if(itr==3 || itr==1)        {
//         if(itr<7)        {
	if(itr==0){
          core.info(`POST: ${x.ownerSlashRepo}, TO: #${x.number}.`);
          octokit.request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
            owner: COMMUNITY_OWNER,
            repo: COMMUNITY,
//             workflow_id: 48178700,
	    workflow_id: 50262476,
            ref: 'main',
             inputs: {
              ownerSlashRepo: x.ownerSlashRepo,
              discNum: String(x.number),
              clgI: core.getInput('clgI')
            },
            headers: {
              'X-GitHub-Api-Version': '2022-11-28'
            }
          })
        }
        
      });       
    }
  
  }else{    core.error('extracted: ERROR!');  }
  
          

        
//         const octokit = new Octokit({
//           auth: core.getInput('tkn')
//         })

// //         if(itr==3 || itr==1)        {
//           core.notice(`POSTING: QualiSystems/Huawei-VRP-WDM-Shell-2G, #1690`);
//           octokit.request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
//             owner: COMMUNITY_OWNER,
//             repo: COMMUNITY,
//             //workflow_id: 50262476,
//             workflow_id: 48178700,
//             ref: 'main',
//              inputs: {
//               ownerSlashRepo: 'QualiSystems/Huawei-VRP-WDM-Shell-2G',
//               discNum: '1690',
//               clgI: core.getInput('clgI')
//             },
//             headers: {
//               'X-GitHub-Api-Version': '2022-11-28'
//             }
//           })
  
  
  
}
