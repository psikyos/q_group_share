/** This file is coding in utf8.
 * 0.open your Chrome browser. 
 * 1.首先登录:https://qun.qq.com/
2.进入群文件：pan.qun.qq.com/clt_filetab/groupShareClientNew.html?gid=398821324&type=102&uri=share#

3.先遍历根目录下所有子目录;
4.进入次级目录下载次级目录的文件;
5.回到根目录;
6.在根目录下载根目录的文件;
问题：1.当文件不在当前目录时,则无法下载。已解决。
2.下载文件成功的记录。已通过重写console.log解决。
*/
function sleep_wj(delay)
{
    return new Promise
	(
		reslove => 
		{
		  setTimeout(reslove, delay)
		}
	  )
}

function sleep_sync(sleepTime) 
{
    for(var start = new Date; new Date - start <= sleepTime;) {}
}

async function down_file_from_section(the_section) 
{
    var a = the_section.getElementsByClassName('v3-down');
    var folder_cnt=0;
    var current_file_cnt=0;
	var actual_down_cnt=0;//actuall donwload file count
    var down_file_arr=new Array();
    for(var i in a) 
    {
        if(typeof(a[i])=="object")//object,number and function
        {
            var some_attr=a[i].getAttribute("data-action");
            if(some_attr=="file.downloadByBtn")
            {
                down_file_arr.push(a[i]);
                current_file_cnt++;
            }
            else if(some_attr=="folder.downloadByBtn")//网页版不支持此批量下载功能,目前只能在根目录计数目录数量
            {
				//a[1].parentNode.parentNode.className.indexOf("fold list-item") should equals to 0
                folder_cnt++;
            }
        }
    }
    console.log('current file count:'+current_file_cnt);
    console.log('folder count:'+folder_cnt);
    for(var i in down_file_arr)//download action
    {
        var down_obj=down_file_arr[i];
        console.log(down_obj.getAttribute('aria-label'));
        down_obj.click();//need to locate to current directory to download.		
		//计数返回success的code:0的数量。
		//success {code: 0, data: {…}, default: 0, message: "", subcode: 0}
		//success {code: -30002, data: {…}, default: 0, message: "secure check fail.", subcode: -1}
		//失败特例BB6AF86A-15DE-445E-B73A-D2003E0F4746
		actual_down_cnt++;
        await sleep_wj(5000);//in case click too fast to response to download.
    }
	return actual_down_cnt;
}//end of function

async function main()
{
	//main routine
	//1.unfold all the sub-directory under the root directory
	var total_down_cnt=0;
	var single_down_cnt=0;
	//define the double click event
	var some_event = new MouseEvent('dblclick', {
		'bubbles': true,
		'cancelable': true
	  });
	console.log("Checking sub dicectory,it may takes a few minutes.");
	var fold_item = document.getElementsByClassName('fold list-item');
	var root_obj=document.getElementsByClassName("root");//the root directory object is an array, the id of a element of span
	for( var i in fold_item)
	{
		if(typeof(fold_item[i])=="object")
		{
			console.log("checking sub directory:",fold_item[i].getAttribute('data-path'));
			await sleep_wj(3000);
			fold_item[i].dispatchEvent(some_event);//double click to open directory
			await sleep_wj(3000);
			//There is no opportunity to down file and no recursive of directory need to access
			console.log("back to root directory.");
			root_obj[0].click();//click to return to root directory
			await sleep_wj(3000);
			//break;
		}
	}
	//reload console.log method to record the succeed count
	var oldLog=console.log;
	var the_success_cnt=0;
	console.log=function()
	{
//		oldLog("original length:",arguments.length);//arguments is an object
		if(arguments.length>1)
		{
			if(arguments[1].code==0)
			{
//				oldLog("成功，返回值是0哦。");
				the_success_cnt++;
			}
		}
//		oldLog("we hooked: ",arguments[0],arguments[1].data);//单独处理一下data
		oldLog("we hooked: ",arguments);
	}

	//展开完所有子目录,此时应有所有子目录的section段
	//2.先下载子目录里的文件
	console.log("Now downloading all files into one local directory.");
	section_items=document.getElementsByClassName('file-list');
	for( var i in fold_item)
	{
		if(typeof(fold_item[i])=="object")
		{
			console.log("downloading sub directory:",fold_item[i].getAttribute('data-path'));
			fold_item[i].dispatchEvent(some_event);
			await sleep_wj(3000);
			//遍历section
			for(var j in section_items)
			{
				if(typeof(section_items[j])=="object")
				{
					var the_dir_id=section_items[j].id;//id="list-20de5e6c-e460-463a-8d2e-5a58abda3204"
					if(the_dir_id!="fileListDom")//该section不是根目录
					{
						var the_dir_id_mod=the_dir_id.substring(5);
						//data-path="/20de5e6c-e460-463a-8d2e-5a58abda3204"
						//data_path_mod="/20de5e6c-e460-463a-8d2e-5a58abda3204"
						var data_path_mod=(fold_item[i].getAttribute("data-path")).substring(1);
						if(the_dir_id_mod==data_path_mod)//打开的目录与选择的section相等
						{						
							single_down_cnt= await down_file_from_section(section_items[j]);
							total_down_cnt+=single_down_cnt;
						}
					}
				}
			}//end of for j
			await sleep_wj(3000);
			//子目录下载完成后,貌似不用点击回根目录
		}
	}
	//3.根目录下的文件处理
	//先点击回根目录
	console.log("back to root directory.Now downloading the root directory.");
	await sleep_wj(3000);
	root_obj[0].click();//click return to root directory
	for(var j in section_items)
	{
		if(typeof(section_items[j])=="object")
		{
			var the_dir_id=section_items[j].id;
			if(the_dir_id=="fileListDom")//该section是根目录
			{
				single_down_cnt=await down_file_from_section(section_items[j]);
				total_down_cnt+=single_down_cnt;
			}
		}
	}
	//4.restore to normal console
	console.log=oldLog;
	console.log("Total download files:",total_down_cnt,".Success count:",the_success_cnt);
	console.log("All files download complete.Thank you for using my code.");
}

main();