const core = require('@actions/core');
const { Octokit } = require('@octokit/core');
const { graphql } = require('@octokit/graphql');
const https = require('https');
const COMMUNITY_OWNER = 'QualiSystems'
const COMMUNITY = 'CloudShell-Community';


run();

async function run() {
if (!core.getInput('clgI').includes(core.getInput('clgS'))) core.error('FAILED CHALLENGE');
else try {
    const ownerSlashRepo = core.getInput('ownerSlashRepo');
    const discNum = core.getInput('discNum');
    const tkn = core.getInput('tkn');

    const owner = ownerSlashRepo.split('/')[0];
    const repo = ownerSlashRepo.split('/')[1];
    
    core.info(`Owner/Repository: ${ownerSlashRepo}`);
    core.info(`Github Discussion Number: ${discNum}`);
    
    let discId;
    const getDiscId_Query = 
`
query GetDiscussionId($name: String!, $owner: String!, $number: Int!) {
  repository(name: $name, owner: $owner) {
    discussion(number: $number) {
      id
      body
      title
    }
  }
}
`;
    
    let getDiscId_QueryHeaders = 
    {
      owner: COMMUNITY_OWNER,
      name: COMMUNITY,
      number: parseInt(discNum),
      headers: {authorization: `Bearer ${tkn}`,},
    };

    let repoDiscussionId;
    let repoDiscussionBody;
    let repoDiscussionUrl;
    let repoDiscussionTitle;

    await graphql(getDiscId_Query,getDiscId_QueryHeaders)
    .then(res=>{
      try{
		core.info(JSON.stringify(res));
        core.notice(res.repository.discussion.id); 
        repoDiscussionId = res.repository.discussion.id;
        repoDiscussionBody = res.repository.discussion.body;
        repoDiscussionTitle = res.repository.discussion.title;
      }catch(e){core.setFailed('GETDISCUSSIONID FAILED.');}
    })
    .catch(errors=>{
      core.notice(errors);        
      core.error(errors);
      core.setFailed('GETDISCUSSIONID ERROR.');
    });

	
          core.info('REPOSITORY\nDISCUSSION ID: '+repoDiscussionId+', DISUCSSION NUMBER: '+discNum);
      let readmeFilePath;
      const octokit = new Octokit({  auth: tkn });
        core.info('TRYING TO FETCH FILE INDEX FROM REPO...');
        await octokit.request('GET /repos/{owner}/{repo}/contents', {
          owner: owner,
          repo: repo
        }).then(res=>{
          try{
			  core.info(JSON.stringify(res));
			  core.info('----------------------');

		  readmeFilePath = res.data.find(file=>file.name.toLowerCase()=='readme.md').path;
          }catch(e){
            core.warning('ERROR FETCHING README FROM ROOT!');
          }         
        }).catch(error=>{core.error(error);});
if (!readmeFilePath) await octokit.request('GET /repos/{owner}/{repo}/contents/docs', {
          owner: owner,
          repo: repo,
		  headers: {			
			'authorization': `Bearer ${tkn}`
			}
        }).then(res=>{
          try{
			  core.info(JSON.stringify(res));
			  core.info('----------------------');

		  readmeFilePath = res.data.find(file=>file.name.toLowerCase()=='readme.md').path;
          }catch(e){
            core.warning('ERROR FETCHING README FROM DOCS!');
          }         
        }).catch(error=>{core.error(error);});
	
        let readmeFile;
        let readmeFileContent;
        if (readmeFilePath){
          await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
              owner: owner,
              repo: repo,
              path: readmeFilePath,
			  headers: {			
			'authorization': `Bearer ${tkn}`
			}
		  
            }).then(res=>{
             try{ 
				readmeFile = res.data; 
				readmeFileContent = Buffer.from(res.data.content, 'base64'); 
			 } catch(_){console.dir(`${_}\nNO README.md for ${owner}/${repo}`)}
              core.info('----------------------');
             
            }).catch(error=>{core.warning(error);});
            
            if (readmeFileContent){
              core.info(readmeFileContent);
              core.info('typeof: '+typeof readmeFileContent);
              core.info('README.md File GET CONTENT, OK');
              
            }
            else{
              core.warning('README.md File, GET CONTENT, ERROR...\n\n');
            }
          }else {
            core.warning('ERROR FETCHING README!');
          }
    

    let unrendered_readmeFileContent;
let rendered_readmeFileContent;
	  
await octokit.request('POST /markdown', {
  text: String(readmeFileContent),
  headers: {
    'X-GitHub-Api-Version': '2022-11-28',
	'authorization': `Bearer ${tkn}`
  }
    }).then(res=>{
      core.info(JSON.stringify(res));
//       try{try{rendered_readmeFileContent = markdown.render(res.data);}catch(__){rendered_readmeFileContent = markdown.render(res);}}
      try{rendered_readmeFileContent = res.data;}
    catch(e_){core.warning(e_);}//rendered_readmeFileContent = res; core.notice('rendered_readmeFileContent = res'); core.info(rendered_readmeFileContent);}
    }).catch(error=>{core.error(error);});
try{
  core.info(`type of readmeFileContent: ${typeof readmeFileContent}`,true);
  



	
	unrendered_readmeFileContent=`<!--_-->
  

${String(readmeFileContent)}

`;
}
catch(e){core.warning(`${JSON.stringify(e)}\nERROR - README.md...`);}
                    
	
                    
//#endregion README.md request


//#region latest_release

    
    let updated_repoDiscussionBody='';
   

    let totalDownloadCount_AllReleases=0;
    let latest_release;
    let assets;

    let latestRelease_published_at;
    await octokit.request('GET /repos/{owner}/{repo}/releases', {
      owner: owner,
      repo: repo
    }).then(res=>{
     
      if (res.data[0]){
        latest_release = res.data[0];
        core.info(JSON.stringify(res.data[0]));
      }
  
     try{
      let cdf=String(latest_release.published_at);
      core.info(cdf);
      let cdf_temp=cdf.split('T')[0].split('-')[1]+'/'+cdf.split('T')[0].split('-')[2]+'/'+cdf.split('T')[0].split('-')[0]+' ';
      let cdf_temp2=parseInt(cdf.split('T')[1].split(':')[0])>=12?parseInt(cdf.split('T')[1].split(':')[0])-12:cdf.split('T')[1].split(':')[0];
      if (cdf_temp2<10)cdf_temp+='0';
      cdf_temp+=cdf_temp2+':'+cdf.split('T')[1].split(':')[1]+' ';
      cdf_temp+=parseInt(cdf.split('T')[1].split(':')[0])>12?'PM':'AM';
      cdf=cdf_temp;
      latestRelease_published_at=cdf;

      Object.keys(res.data).forEach(key=>{
        if (res.data[key].assets && res.data[key].assets.length>0){
          Object.values(res.data[key].assets).forEach(asset=>{
            totalDownloadCount_AllReleases+=asset.download_count;
          });
        }
        else{
          core.warning('NO ASSETS!');
        }
      });
      
      //still in .then(res=>{
      assets=res.data[0].assets;     
      core.info(JSON.stringify(assets));    
      //core.notice('^^^ LATEST RELEASE ASSETS res.data[0].assets ^^^');
     }catch(e){}
    }).catch(e=>{core.info(e);core.warning('FETCH LATEST RELEASE METADATA, FAILURE');});
         
    let assets_str='';
    try{ 
      if (assets && Object.keys(assets).length>0){

        assets.forEach(asset=>{
          let sizeFormatted = 
              asset.size<1024?String(asset.size)+'b':asset.size/1024<1024?String(asset.size/1024)+'KB':String(asset.size/1024/1024)+'MB';
          try{
            let scaleSuffix='';
            if (sizeFormatted.includes('KB')){
              sizeFormatted=sizeFormatted.split('.')[0];
              scaleSuffix='KB';
            }
            else if (sizeFormatted.includes('MB')){
              sizeFormatted=sizeFormatted.split('.')[0]+'.'+sizeFormatted.split('.')[1].substring(0,2);
              scaleSuffix='MB';
            } else scaleSuffix='b';
            if (sizeFormatted.replace('.','').length>=7) sizeFormatted=sizeFormatted[0]+','+sizeFormatted.substring(1,4)+','+sizeFormatted.substring(4,sizeFormatted.length);
            sizeFormatted+=' '+scaleSuffix;
assets_str+=`<a href="${asset.browser_download_url}">${asset.name}<sup><br>[${sizeFormatted}]</sup></a><br></a><br>`
          }catch(e){}
        });
       }
    }catch(e){core.warning('ASSETS ERROR')}
          

    //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  
    //BODY    //BODY   //BODY    //BODY   //BODY   //BODY    //BODY   //BODY   //BODY    //BODY   //BODY   //BODY    //BODY   //BODY    //BODY   //BODY   //BODY  //BODY    //BODY   //BODY  
//BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  //BODY  
//#region //BODY
try{
  if(!repoDiscussionBody.includes(`<h1>${repoDiscussionTitle}</h1>`) && !updated_repoDiscussionBody.includes(`<h1>${repoDiscussionTitle}</h1>`))
        updated_repoDiscussionBody += 
`
<h1>${entry.title}</h1>`;
}catch(er){
  if(!updated_repoDiscussionBody.includes(`<h1>${repoDiscussionTitle}</h1>`))
        updated_repoDiscussionBody += 
`
<h1>${repoDiscussionTitle}</h1>
\n

`;
}
				if(repoDiscussionBody.includes(`<!--KEEP--><!--CUTOFF--><!--KEEP-->undefined<!--CUTOFF--><!--KEEP-->`))
				   repoDiscussionBody = repoDiscussionBody.split(`<!--KEEP--><!--CUTOFF--><!--KEEP-->undefined<!--CUTOFF--><!--KEEP-->`)[0];
							if (repoDiscussionBody.includes(`<table width="100%" align="center">`))
      updated_repoDiscussionBody += 
`${repoDiscussionBody.split('<table width="100%" align="center">')[0]}
\n

`;

							else {
updated_repoDiscussionBody += `<br>\n
${repoDiscussionBody}
\n

<table width="100%" align="center">`;
							}
								
							
	
	
	
	
if(!updated_repoDiscussionBody.includes('<!--CUTOFF-->'))
  updated_repoDiscussionBody +=
`\n

<!--KEEP--><!--CUTOFF--><!--KEEP-->\n

`;
    

repoDiscussionUrl=`https://github.com/${owner}/${repo}`;

updated_repoDiscussionBody += 
`\n

<table width="100%" align="center">`;
try{
  updated_repoDiscussionBody +=
`<th><h3><a href="${repoDiscussionUrl}">Repository</a></h3></th>`;
}catch(er){
  updated_repoDiscussionBody +=
`<th><h3><a href="">Repository</a></h3></th>`;
}

if (
    readmeFile && readmeFileContent && 
    (
      rendered_readmeFileContent.includes('* **') || rendered_readmeFileContent.includes('```') || 
      rendered_readmeFileContent.includes('<li>') || rendered_readmeFileContent.includes('<ul>') || 
      rendered_readmeFileContent.includes('<ol>') || rendered_readmeFileContent.includes('- | -') ||
      rendered_readmeFileContent.includes('-|-') || rendered_readmeFileContent.includes('- | :') ||
      rendered_readmeFileContent.includes('-|:') || rendered_readmeFileContent.includes(': | -') || 
      rendered_readmeFileContent.includes(':|-') || rendered_readmeFileContent.includes(': | :') ||
      rendered_readmeFileContent.includes(':|:') || rendered_readmeFileContent.includes('1)') || rendered_readmeFileContent.includes('1.')
    )
  ){
 
 try{
    if (latest_release && latest_release.html_url) updated_repoDiscussionBody += 
`<th><h3><a href="${latest_release.html_url}">Latest Release</a></h3></th>`;
    else if (latest_release) updated_repoDiscussionBody += `<th><h3>Latest Release</h3></th>`;
 }catch(erro){
  updated_repoDiscussionBody +=
`<th><h3>Latest Release</h3></th>`;
  }
  try{if (readmeFile && readmeFile.html_url) updated_repoDiscussionBody += 
`<td valign="top"><h3><a href="${readmeFile.html_url}">README.md</a></h3></td>`;
  }
  catch(e){
    if (readmeFile) updated_repoDiscussionBody += 
`<td valign="top"><h3>README.md</h3></td>`;
  }
}
else{
  try{
    if (readmeFile && readmeFile.html_url) updated_repoDiscussionBody += 
`<th><h3><a href="${readmeFile.html_url}">README.md</a></h3></th>`;
  }catch(e){
    if (readmeFile) updated_repoDiscussionBody += 
`<th valign="top"><h3>README.md</h3></th>`;             
  }
  
  
try{
  if (latest_release && latest_release.html_url) updated_repoDiscussionBody += 
`<th><h3><a href="${latest_release.html_url}">Latest Release</a></h3></th>`;
  else if (latest_release) updated_repoDiscussionBody += 
`<th><h3>Latest Release</h3></th>`;
}catch(erro){
  if(latest_release) updated_repoDiscussionBody +=
`<th><h3>Latest Release</h3></th>`;
}
}
      

	  
	  updated_repoDiscussionBody += 
`<tbody>
<tr valign="top"><!--KEEP--><!--CUTOFF--><!--KEEP-->`;


											if(repoDiscussionBody.split('<!--CUTOFF-->')[2]){
	updated_repoDiscussionBody += 	  
`${repoDiscussionBody.split('<!--CUTOFF-->')[2]}<!--CUTOFF--><!--KEEP-->`;
											}else {
if (repoDiscussionUrl)
updated_repoDiscussionBody += 	  
`<th><h3><a href="${repoDiscussionUrl}">${repoDiscussionUrl}</a></h3>`;
else
updated_repoDiscussionBody += 	  
`<th><!--CUTOFF--><!--KEEP-->`;

											}
          if (latest_release && assets_str) updated_repoDiscussionBody += 
`Total Downloads<sup><br>(All Releases)</sup><br>${totalDownloadCount_AllReleases}<br><br>`;
  
  updated_repoDiscussionBody += `</th>`;        
  
  
  let astCount=0;
  let slsCount=0;
  let limit = 5;
  let rfc = unrendered_readmeFileContent;
  if (rfc.includes('-    ')||rfc.includes('   -   '))
   while (slsCount<3&&limit>0){
    try{limit--;slsCount++;
    }catch(e){}
  }
  astCount=0;
  slsCount=0;
  limit = 5;
  rfc = unrendered_readmeFileContent;
  if (rfc.includes('* *')||rfc.includes('* '))
   while (astCount<5&&limit>0){
    try{limit--;astCount++;
    }catch(e){
            }
  }

  try{core.info(`slsCount: ${slsCount}`)}catch{}
  try{core.info(`astCount: ${astCount}`)}catch{}
  
  if(slsCount==0||astCount==0)
  {
    astCount=0;
    let rex = /\*/g;
    let matcz;
    while ((matcz=rex.exec(unrendered_readmeFileContent))!==null) {
      astCount++;
      if (astCount>5) break;
  }  
  slsCount=0;
  rex = /-\s{2,}./g;
  matcz=null;
  while ((matcz=rex.exec(unrendered_readmeFileContent))!==null) {
      slsCount++;
    core.info('SLSCOUNT');
    if (slsCount>3) break;
  }  
  }

try{core.info(`slsCount: ${slsCount}`)}catch{}
try{core.info(`astCount: ${astCount}`)}catch{}
  


  try{
          
          if (
            readmeFileContent && 
            (
              astCount<5 && slsCount<3 && !rendered_readmeFileContent.includes('<pre>') &&
              !rendered_readmeFileContent.includes('* **') && !rendered_readmeFileContent.includes('```') && 
              !rendered_readmeFileContent.includes('<li>') && !rendered_readmeFileContent.includes('<ul>') &&
              !rendered_readmeFileContent.includes('<ol>') && !rendered_readmeFileContent.includes('- | -') &&
              !rendered_readmeFileContent.includes('-|-') && !rendered_readmeFileContent.includes('- | :') &&
              !rendered_readmeFileContent.includes('-|:') && !rendered_readmeFileContent.includes(': | -') && 
              !rendered_readmeFileContent.includes(':|-') && !rendered_readmeFileContent.includes(': | :') &&
              !rendered_readmeFileContent.includes(':|:') && !rendered_readmeFileContent.includes('1)') && !rendered_readmeFileContent.includes('1.')
            )  
          ) 
              updated_repoDiscussionBody += `
<!--README.md-->
<th valign="top">

${unrendered_readmeFileContent}

</th>
<!--README.md-->`;

  
  }catch(e){core.info('readmeFileContent ERROR!!!')} 

      let tarLink, tarLinkStr;
      try{tarLink = latest_release.tarball_url;}catch(e){core.info('NO TAR LINK');}
      try{if (tarLink) tarLinkStr = latest_release.tarball_url.split('tarball/')[1]+' (TAR)'}catch(e){}
      let zipLink, zipLinkStr;
      try{zipLink = latest_release.zipball_url;}catch(e){core.info('NO ZIP LINK');}
      try{if (zipLink) zipLinkStr = latest_release.zipball_url.split('zipball/')[1]+' (ZIP)'}catch(e){}  
      
 
      if (latest_release) updated_repoDiscussionBody +=
`<th valign="top" width="20%">
<br>
Link<br><a href="${latest_release.html_url}">${latest_release.tag_name}</a><sup><br>(Version / Tag)</sup><hr/>`;

          if (latest_release && (tarLink || zipLink))
            updated_repoDiscussionBody +=
`TAR / ZIP<br>${tarLink?'<a href=\"'+tarLink+'\">'+tarLinkStr+'</a><br>':''}${zipLink?'<a href=\"'+zipLink+'\">'+zipLinkStr+'</a>':''}<hr/>`;


  try{
    if (latest_release){ 
      let reg = /0([0-9]{2,3})(?=:)/;
      let matReg = latestRelease_published_at.match(reg);
      if (matReg!=null)
       latestRelease_published_at = latestRelease_published_at.replace(matReg[0],matReg[1]);
    }
  }catch(errorrore){}

  if (latest_release){ 
            updated_repoDiscussionBody +=
`Author<br><a target="_blank" href="${latest_release.author.html_url}">${latest_release.author.login}</a><hr/>
Published On<br>${latestRelease_published_at}<hr/>`;
            
   if (assets_str)         updated_repoDiscussionBody +=
`Assets<br>
${assets_str}
<br>
</th>`;
          }

  try{
    if (
      readmeFileContent && 
      (
        astCount>=5 || slsCount>=3 || rendered_readmeFileContent.includes('<pre>') ||
        rendered_readmeFileContent.includes('* **') || rendered_readmeFileContent.includes('```') || 
        rendered_readmeFileContent.includes('<li>') || rendered_readmeFileContent.includes('<ul>') || 
        rendered_readmeFileContent.includes('<ol>') || rendered_readmeFileContent.includes('- | -') ||
        rendered_readmeFileContent.includes('-|-') || rendered_readmeFileContent.includes('- | :') ||
        rendered_readmeFileContent.includes('-|:') || rendered_readmeFileContent.includes(': | -') || 
        rendered_readmeFileContent.includes(':|-') || rendered_readmeFileContent.includes(': | :') ||
        rendered_readmeFileContent.includes(':|:') || rendered_readmeFileContent.includes('1)') || rendered_readmeFileContent.includes('1.')
      )
    )
      updated_repoDiscussionBody += 
`<!--README.md-->
<td valign="top">

${unrendered_readmeFileContent}

</td>
<!--README.md-->`;


}catch(e){core.info('readmeFileContent ERROR!!!')} 

          updated_repoDiscussionBody +=
  `</tr>
  </tbody>`;
        
          if (readmeFileContent && latest_release) {
            
              if (
                readmeFileContent && 
                (
                  astCount<5 && slsCount<3 && !rendered_readmeFileContent.includes('<pre>') &&
                  !rendered_readmeFileContent.includes('* **') && !rendered_readmeFileContent.includes('```') &&
                  !rendered_readmeFileContent.includes('<li>') && !rendered_readmeFileContent.includes('<ul>') &&
                  !rendered_readmeFileContent.includes('<ol>') && !rendered_readmeFileContent.includes('- | -') &&
                  !rendered_readmeFileContent.includes('-|-') && !rendered_readmeFileContent.includes('- | :') &&
                  !rendered_readmeFileContent.includes('-|:') && !rendered_readmeFileContent.includes(': | -') && 
                  !rendered_readmeFileContent.includes(':|-') && !rendered_readmeFileContent.includes(': | :') &&
                  !rendered_readmeFileContent.includes(':<') && !rendered_readmeFileContent.includes('1)') && !rendered_readmeFileContent.includes('1.')
                )
              ) {
              updated_repoDiscussionBody +=       
  `<tfoot>
  <th align="right">
  <sub><sup>* Updated Weekly</sup></sub>
  </th>
  <th><sub><sup>* Repository, release and asset info is updated weekly.<br>Please allow 30-60 seconds for manual update changes to take effect.</sub></sup></th>
  <th align="left">
  <sub><sup><a href="https://hooks.zapier.com/hooks/catch/13116203/b7e29bg?OR=${owner}/${repo}&DN=${discNum}">* Update Now</a></sup></sub>
  </th>
  </tfoot>
  </table>`;
            }else{  
              updated_repoDiscussionBody +=       
`<tfoot>
  <th align="right">
  <sub><sup>* Updated Weekly</sup></sub>
  </th>
  <th align="right">
  <sub><sup><a href="https://hooks.zapier.com/hooks/catch/13116203/b7e29bg?OR=${owner}/${repo}&DN=${discNum}">* Update Now</a></sup></sub>
  </th>
  <td><strong><sub><sup>* Repository, release and asset info is updated weekly.<br>* Please allow 30-60 seconds for manual update changes to take effect.</sub></sup></strong></td>
  </tfoot>
  </table>`;
            }
  
//           }else updated_repoDiscussionBody += 
//   `</table>
//   <table width="100%" align="center">
//   <td align="right">
//   <sub><sup>* Updated Weekly</sup></sub>
//   </td>
//   <td><strong><sub><sup>* Repository, release and asset info is updated weekly.<br>* Please allow 30-60 seconds for manual update changes to take effect.</sub></sup></strong></td>
//   <td align="left">
//   <sub><sup><a href="https://hooks.zapier.com/hooks/catch/13116203/b7e29bg?OR=${owner}/${repo}&DN=${discNum}">* Update Now</a></sup></sub>
//   </td>
//   </table>`;

	  //#endregion //BODY

	//#region mend  #%

	let regexp;
	let match;
	let matches=[];                        



	  try{
		if(updated_repoDiscussionBody.includes('<img src="Pics/')){
		  try{
			updated_repoDiscussionBody = updated_repoDiscussionBody.replaceAll('<img src="Pics/',`<img src="${owner}/${repo}/Pics/`);
		  
		}catch(ex){core.info(`${JSON.stringify(ex)}\nUNABLE TO REPLACE <img src="Pics/ TO <img src={owner}/{repo}/Pics`);}
	  }
	  }catch(e_){core.info(`${e_}\nimg src ERROR!`);}
	  
	  try{
		if(updated_repoDiscussionBody.includes('](Pics/')){
		  try{
			updated_repoDiscussionBody = updated_repoDiscussionBody.replaceAll('](Pics/',`](/Pics/`);
		  
		}catch(ex){core.info(`${ex}\nUNABLE TO REPLACE ](Pics/, ](/{owner}/{repo}/Pics/`);}
	  }
	  }catch(e_){core.info(`${e_}\n/Pics ERROR!`);}




	try{
		   regexp=/!?\s?\[.*?\]\((.*?)\)/g;
		   match=undefined;  matches=[];
		   let tmatch;
		  while ((match = regexp.exec(updated_repoDiscussionBody)) !== null){
			try{core.info(match[0]);}catch(_){core.info(`${_}\n       regexp=/!?\s?\[.*?\]\((.*?)\)/g;        `)}
			core.info(`       regexp=/!?\s?\[.*?\]\((.*?)\)/g;        `);

			if(match[0].includes('![](Images/')){
				try{
				match[2] = match[0].replaceAll('![](Images/',`![](/${owner}/${repo}/raw/master/Images/`);
				matches.push(match);
				continue;
			  }catch(ex){core.info(`${JSON.stringify(ex)}\nUNABLE TO REPLACE ![](Images/___) TO ![](/{owner}/{repo}/raw/master/Images/{match[1]}`);}
			}
			  else if(match[0].includes('![](pics/')){
				try{
				  match[2] = match[0].replaceAll('![](pics/',`![](/pics/${match[1]}`);
				  matches.push(match);
				  continue;
				}catch(exe){core.info(`${JSON.stringify(exe)}\nUNABLE TO REPLACE ![]([pics]/___) TO ![](/{owner}/{repo}/Pics/{match[1]}`);}
			}
			  else if(match[0].includes('![](Pics/')){
				try{
				  match[2] = match[0].replaceAll('![](Pics/',`![](/Pics/${match[1]}`);
				  matches.push(match);
				  continue;
				}catch(exe){core.info(`${JSON.stringify(exe)}\nUNABLE TO REPLACE ![]([Pics]/___) TO ![](/{owner}/{repo}/Pics/{match[1]}`);}
			}
			  else if(match[0].includes('](Images/')){
				  try{
					match[2] = match[0].replaceAll('](Images/',`](/${owner}/${repo}/raw/master/Images/`);
					matches.push(match);
					continue;
				}catch(exe){core.info(`${JSON.stringify(exe)}\nUNABLE TO REPLACE ![.*](Images/___) TO ![](/{owner}/{repo}/raw/master/Images/{match[1]}`);}
			  }
			  else if(match[0].includes('](pics/')){
				  try{
					match[2] = match[0].replaceAll('](pics/',`](/pics/`);
					matches.push(match);
					continue;
				}catch(exe){core.info(`${JSON.stringify(exe)}\nUNABLE TO REPLACE ![.*](pics/___) TO ![](/{owner}/{repo}/pics/{match[1]}`);}
			  }
			  else if(match[0].includes('](Pics/')){
				  try{
					match[2] = match[0].replaceAll('](Pics/',`](/Pics/`);
					matches.push(match);
					continue;
				}catch(exe){core.info(`${JSON.stringify(exe)}\nUNABLE TO REPLACE ![.*](Pics/___) TO ![](/{owner}/{repo}/Pics/{match[1]}`);}
			  }


			  else if (((tmatch = match[0].match(/.*\/(.*?\.(svg\??.*?|jpg|jpeg|png|gif|bmp|mp4|mov|webm))\)/))!==null) &&
			  match[1].includes('Images/')){
				try{
				  match[2] = match[0].replaceAll('](Images/',`](/${owner}/${repo}/raw/master/Images/`);
				  matches.push(match);
				  continue;
				}catch(ex){core.info(`${JSON.stringify(ex)}\nUNABLE TO REPLACE ](Images/___.*) TO ...](/{owner}/{repo}/raw/master/Images/{match[1]}`)}
			  }
			  else if (((tmatch = match[0].match(/.*\/(.*?\.(svg\??.*?|jpg|jpeg|png|gif|bmp|mp4|mov|webm))\)/))!==null) &&
			  match[1].includes('pics/')){
				try{
				  match[2] = match[0].replaceAll('](pics/',`](/pics/`);
				  matches.push(match);
				  continue;
				}catch(ex){core.info(`${JSON.stringify(ex)}\nUNABLE TO REPLACE ](pics/___.*) TO ...](/{owner}/{repo}/pics/{match[1]}`)}
			  }
			  
			  else if (((tmatch = match[0].match(/.*\/(.*?\.(svg\??.*?|jpg|jpeg|png|gif|bmp|mp4|mov|webm))\)/))!==null) &&
			  match[1].includes('Pics/')){
				try{
				  match[2] = match[0].replaceAll('](Pics/',`](/Pics/`);
				  matches.push(match);
				  continue;
				}catch(ex){core.info(`${JSON.stringify(ex)}\nUNABLE TO REPLACE ](Pics/___.*) TO ...](/{owner}/{repo}/Pics/{match[1]}`)}
			  }
			  

			  else if (((tmatch = match[0].match(/\]\(.*?\/.*?\..*?\)/))!==null)
			  && !match[1].includes('http') && !match[1].includes('www') 
			  && !match[1].includes('github.com') ){
				try{
				  match[2]=match[0].replace('](',`](/${owner}/${repo}/raw/master/`);
				  matches.push(match);
				  continue;
				}catch(ex){core.info(`${JSON.stringify(ex)}\nUNABLE TO REPLACE ![...](/___.*) TO ![...](/{owner}/{repo}/raw/master/{match[1]}`)}
			  }
			  
	if (((tmatch = match[0].match(/.*\/(.*?\.(svg\??.*?|jpg|jpeg|png|gif|bmp|mp4|mov|webm))\)/))!==null)
	&& match[1].includes('github.com') )
	{
	  
	  if (match[1].includes('/blob/master/')){
		try{match[2]=match[0].replaceAll('/blob/master/','/raw/master/');}catch(_){core.info('CAUGHT ERROR: /blob/master/ => /raw/master/');}
		matches.push(match);
	  }
	 }

	  else if(!match[1].includes('http')&&!match[1].includes('www')&&!match[1].includes('github.com')
	  && match[1].match(/.*\/.*/)!==null&&!match[1].includes('.')) 
	   {
		match[2]=`https://github.com/${owner}/${repo}/blob/master/${match[1]}`;
		matches.push(match);
	   }
	  

			}
		}catch(e){core.info(`ERROR:::::::::::::::::::`);core.info(e);}
	  try{
		core.info(matches.map(o=>o[1]+':'+o[2]));     

		}    catch(e){core.info(`ERROR:::::::::::::::::::`);;core.info(e);}
	try{
		  matches.forEach(m=>{
			core.info('CHANGING ');
			core.info(m[0]+'\nTO:\n'+m[2]);
			core.info('CHANGING...');
			updated_repoDiscussionBody = updated_repoDiscussionBody.replace(m[0],`${m[2]}`);});
	  }catch(e){core.info(`ERROR:::::::::::::::::::`);core.info(e);}

	
	try{
		updated_repoDiscussionBody = 
			updated_repoDiscussionBody.replaceAll(
`![](cloudshell_logo.png)`,
`
\n
![](/QualiSystems/CloudShell-Community/raw/main/attstor/cloudshell_logo.png)
`);

	}catch(_e_){core.warning(_e_);}

	
	
	

try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`http://community.quali.com/users/`,`#`);}catch(_e){core.error(`${_e}\nERROR CHANGING USER URL`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`https://community.quali.com/users/`,`#`);}catch(_e){core.error(`${_e}\nERROR CHANGING USER URL`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`community.quali.com/users/`,`#`);}catch(_e){core.error(`${_e}\nERROR CHANGING USER URL`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`http://community.quali.com/articles/create?space=36#`,`#`);}catch(_e){core.error(`${_e}\nERROR CHANGING ARTICLES/create?space=36#`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`https://community.quali.com/articles/create?space=36#`,`#`);}catch(_e){core.error(`${_e}\nERROR CHANGING ARTICLES/create?space=36#`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`community.quali.com/articles/create?space=36#`,`#`);}catch(_e){core.error(`${_e}\nERROR CHANGING ARTICLES/create?space=36#`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`http://community.quali.com/ideabox`,`/QualiSystems/CloudShell-Community/discussions/categories/idea-box`);}catch(_e){core.error(`${_e}\nERROR CHANGING ideabox`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`https://community.quali.com/ideabox`,`/QualiSystems/CloudShell-Community/discussions/categories/idea-box`);}catch(_e){core.error(`${_e}\nERROR CHANGING ideabox`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`community.quali.com/ideabox`,`/QualiSystems/CloudShell-Community/discussions/categories/idea-box`);}catch(_e){core.error(`${_e}\nERROR CHANGING ideabox`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`http://community.quali.com/integrations`,`/QualiSystems/CloudShell-Community/discussions/categories/integrations`);}catch(_e){core.error(`${_e}\nERROR CHANGING integrations`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`https://community.quali.com/integrations`,`/QualiSystems/CloudShell-Community/discussions/categories/integrations`);}catch(_e){core.error(`${_e}\nERROR CHANGING integrations`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`community.quali.com/integrations`,`/QualiSystems/CloudShell-Community/discussions/categories/integrations`);}catch(_e){core.error(`${_e}\nERROR CHANGING integrations`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`http://community.quali.com/ideas/state/Delivered`,`/QualiSystems/CloudShell-Community/discussions?discussions_q=label%3A%223%C2%B710+%3Abulb%3A+Delivered%22`);}catch(_e){core.error(`${_e}\nERROR CHANGING Delivered idea state`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`https://community.quali.com/ideas/state/Delivered`,`/QualiSystems/CloudShell-Community/discussions?discussions_q=label%3A%223%C2%B710+%3Abulb%3A+Delivered%22`);}catch(_e){core.error(`${_e}\nERROR CHANGING Delivered idea state`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`community.quali.com/ideas/state/Delivered`,`/QualiSystems/CloudShell-Community/discussions?discussions_q=label%3A%223%C2%B710+%3Abulb%3A+Delivered%22`);}catch(_e){core.error(`${_e}\nERROR CHANGING Delivered idea state`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`http://community.quali.com/spaces/12/index.html`,`/QualiSystems/CloudShell-Community/discussions/categories/forums`);}catch(_e){core.error(`${_e}\nERROR CHANGING spaces/12/index`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`https://community.quali.com/spaces/12/index.html`,`/QualiSystems/CloudShell-Community/discussions/categories/forums`);}catch(_e){core.error(`${_e}\nERROR CHANGING spaces/12/index`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`community.quali.com/spaces/12/index.html`,`/QualiSystems/CloudShell-Community/discussions/categories/forums`);}catch(_e){core.error(`${_e}\nERROR CHANGING spaces/12/index`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`http://community.quali.com/spac`,`/QualiSystems/CloudShell-Community/discussions/categories/forums`);}catch(_e){core.error(`${_e}\nERROR CHANGING spac`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`https://community.quali.com/spac`,`/QualiSystems/CloudShell-Community/discussions/categories/forums`);}catch(_e){core.error(`${_e}\nERROR CHANGING spac`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`community.quali.com/spac`,`/QualiSystems/CloudShell-Community/discussions/categories/forums`);}catch(_e){core.error(`${_e}\nERROR CHANGING spac`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`http://community.quali.com`,`/QualiSystems/CloudShell-Community/discussions`);}catch(_e){core.error(`${_e}\nERROR CHANGING community.quali.com`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`https://community.quali.com`,`/QualiSystems/CloudShell-Community/discussions`);}catch(_e){core.error(`${_e}\nERROR CHANGING community.quali.com`);}
try{updated_repoDiscussionBody=updated_repoDiscussionBody.replaceAll(`community.quali.com`,`/QualiSystems/CloudShell-Community/discussions`);}catch(_e){core.error(`${_e}\nERROR CHANGING community.quali.com`);}

	
						try{
							let regger = /!\[Image\](\[(\d)\])/g
							let mcs=[]; let matG; 
							while ((matG=regger.exec(updated_repoDiscussionBody))!==null){
// 								if((matS = updated_repoDiscussionBody.match(/\[(\d)\]: (.*?)\n/g))!=null)
									mcs.push(matG);//if (matG[2]==matS[1]) //mcs.push({src:matG,tgt:matS});
										
						       }
							let mcos=[]; let matS;
// 							mcs.forEach(m=>{
// 								try{m.tgt[2]=m.tgt[2].replace('blob','raw');}catch(_){}
// 								updated_repoDiscussionBody=updated_repoDiscussionBody.replace(m.src[1],`(${m.tgt[2]})`);
							let reggio=/\[(\d)\]: (.*?)\n/g;	
							while((matS = reggio.exec(updated_repoDiscussionBody))!=null){
									mcos.push(matS);//if (m[2]==matS[1]) mcos.push({src:matG,tgt:matS});
								}
// 							});
							mcos.forEach(m=>{
								let tgt;
								try{tgt=mcs.find(mc=>mc[2]==m[1]);}catch(_){}
								try{m[2]=m[2].replace('blob','raw');}catch(_){}
								try{updated_repoDiscussionBody=updated_repoDiscussionBody.replace(tgt[1],`(${m[2]})`);}catch(_){core.warning(_);}
								
							});
						}catch(___){}
	
	
	
	try{
		let fbstr='';
			try{
fbstr +=
`<th><h3><a href="${repoDiscussionUrl}">${repoDiscussionUrl}</a></h3>`;
}catch(er){
  fbstr +=
`<th>`;
}
		updated_repoDiscussionBody=updated_repoDiscussionBody.replace(
			`<!--KEEP--><!--CUTOFF--><!--KEEP-->undefined<!--CUTOFF--><!--KEEP-->`,
			`<!--KEEP--><!--CUTOFF--><!--KEEP-->${fbstr}<!--CUTOFF--><!--KEEP-->`);
		
	}catch(_e){core.error(`${_e}\nERROR CHANGING <!--KEEP--><!--CUTOFF--><!--KEEP-->undefined<!--CUTOFF--><!--KEEP-->`);}

					
	//#endregion mend 



						  //SIG:
						  try{
							if (repoDiscussionBody.includes('<hr><h6')){
								updated_repoDiscussionBody+='<hr><h6'+repoDiscussionBody.split('<hr><h6')[1];
							}
						  }catch(_e_){core.info(_e_);}


	core.info('+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*');
		core.info(repoDiscussionId);
		core.info(discNum);
		try{core.info(latest_release.html_url);}catch(e){}
		try{core.info('README.md: '+readmeFileContent!==undefined);}catch(e){}
		try{core.info('ASSETS: '+Object.keys(assets).length);}catch(e){}
		try{core.info(latestRelease_published_at);}catch(e){}
		core.info('+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*');
		core.info('+*+*+*+*+*+*+*+*:BODY:+*+*+*+*+*+*+*+*+*+*+*+*');
		core.info(updated_repoDiscussionBody);
		core.info('+*+*+*+*+*+*+*+*^BODY^+*+*+*+*+*+*+*+*+*+*+*+*');
		core.info('+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*');
		core.info('+*+*+*+*+*+*+*+*:::MUTATION:::+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*');

    let updateDiscussionMutation =
  `mutation UpdateDiscussion($discussionId: ID!, $body: String, $clientMutationId: String) {
    updateDiscussion(
      input: {discussionId: $discussionId, body: $body, clientMutationId: $clientMutationId}
      ) {
        clientMutationId
      }
    }`;
    let updateDiscussionMutationHeaders = 
    {
      discussionId: repoDiscussionId,
      body: updated_repoDiscussionBody,
      clientMutationId: 'UpdateDiscussion:OK!',
      headers: {authorization: `Bearer ${tkn}`,},
    };
    
    await graphql(updateDiscussionMutation,updateDiscussionMutationHeaders)
                                .then(res=>{
                                  core.info(JSON.stringify(res));
                                  (JSON.stringify(res).includes('UpdateDiscussion:OK!')) ?
                                    core.notice(`DISCUSSION ${discNum} UPDATED.`) : core.error(`UPDATE ${discNum} DISCUSSION FAILED.`) ;
                                })
                                .catch(errors=>{
                                  core.warning(errors);        
                                  core.error('ERROR UPDATING DISCUSSIONS.');
                                });  
  
  core.info('+*+*+*+*+*+*+*+*^^^MUTATION^^^+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*');
  core.notice('FIN');
  core.info('+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*');
  core.info('+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*');
    
    
    
    
  } catch (error) {
    core.error('FAILURE');
    core.error(error.message);
    core.setFailed(error.message);
  }
  
}

