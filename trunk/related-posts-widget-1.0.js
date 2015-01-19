/* 	Author : Mike @ moretechtips.net
	Blog : http://www.moretechtips.net
	Project: http://code.google.com/p/blogger-related-posts
	Copyright 2009 [Mike@moretechtips.net] 
	Licensed under the Apache License, Version 2.0 
	(the "License"); you may not use this file except in compliance with the License. 
	You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 
	Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License. 
*/
function relatedPostsWidget(userOp){
	(function($){ 
		var op = {
			'blogURL':''
			,'maxPosts':5
			,'maxTags':5
			,'maxPostsPerTag':5
			,'containerSelector':''
			,'tags':null
			,'loadingText':''
			,'loadingClass':''
			,'relevantTip':''
			,'relatedTitle':'Related Posts'
			,'recentTitle':'Recent Posts'
			,'postScoreClass':''
			,'onLoad':false
		};
		op = $.extend({}, op, userOp);
		var tagsLoaded = 0,div= null,ul=null;
		// If no contianer selected , will create div in place of script call
		if (!op.containerSelector) {
			document.write('<div id="related-posts"></div>');
			op.containerSelector = '#related-posts';
		};
		// Tag json posts are loaded
		var tagLoaded = function(json,status){
			tagsLoaded++;
			if(json.feed.entry) {
				for (var i=0; i<json.feed.entry.length; i++) {
					var entry = json.feed.entry[i];
					var url='';
					for (var k=0; k<entry.link.length; k++) {
						if(entry.link[k].rel=='alternate') {
							url = entry.link[k].href;
							break;
						};
					};
					var title = entry.title.$t;
					//Ignore current url
					if(location.href.toLowerCase()!= url.toLowerCase()) addPost(url,title);
				};
			};
			// Loading posts of all tags is done
			if(tagsLoaded>=op.tags.length) {
				 ul.attr('class','');
				 $('#related-posts-loadingtext',div).remove();
				 // Hide extra posts if maxPosts >0
				 if(op.maxPosts>0) $('li:gt('+ (op.maxPosts-1) +')',ul).remove();
			};
		};
		// Add post and re-order
		var addPost = function(url,title) {
			//current LI items inside of UL
			var list = $('li',ul);
			for(var i=0; i<list.length; i++) {
				//get score
				var a= $('a', list.eq(i) );
				var sc = getScore(a);
				//Post exists ?
				if(a.attr('href')==url) {
					//Yes : Then increment score
					setScore(a,++sc);
					//Re-order : compare with prevoius li items
					for(var j=i-1; j>=0; j--){
						// find the item with higher score than current
						var jA= $('a', list.eq(j) );
						if (getScore(jA)>sc) {
							// re-order if only there are items in the middle to appear before
							if(i-j>1) list.eq(j).after(list.eq(i));
							return;
						};
					};
					// If no higher item then this one should go first
					if(i>0) list.eq(0).before(list.eq(i));
					return;
				};
			};
			//Add new post
			ul.append('<li><a href="'+url+'" title="'+(op.relevantTip? op.relevantTip.replace('\d',1):'')+'">'+title+'</a></li>');
		};
		// parse score from attribute
		var getScore = function(a){
			var score = parseInt(a.attr('score'));
			return score>0? score : 1;
		};
		// set score from attribute
		var setScore = function(a,sc) {
			a.attr('score',sc);
			if(op.relevantTip) a.attr('title',op.relevantTip.replace('\d',sc)); 
			if(op.postScoreClass) a.attr('class',op.postScoreClass+sc); 
		};
		// init 
		var initRelatedPosts = function() {
			// append my div to user selected container 
			if(op.containerSelector != '#related-posts'){
				var container = $(op.containerSelector);
				// check contianer is there and only one for pages like home
				if (container.length!=1) return;
				div = $('<div id="related-posts"></div>').appendTo(container);
			}
			else div = $(op.containerSelector); // div which I wrote on document
			
			// get tags if wasn't preset
			if (!op.tags) {
				op.tags = [];
				$('a[rel="tag"]:lt('+op.maxTags+')').each(function () {
					var tag= $.trim($(this).text().replace(/\n/g,''));
					if($.inArray(tag,op.tags)==-1) op.tags[op.tags.length]=tag;
				});
			};
			// should make recent posts but no recent title :exit
			if(op.tags.length==0 && !op.recentTitle) return;
			
			//add recent posts title
			if(op.tags.length==0) $('<h2>'+op.recentTitle+'</h2>').appendTo(div);
			//add related posts title if any
			else if(op.relatedTitle) $('<h2>'+op.relatedTitle+'</h2>').appendTo(div);
			
			//Add loading text if any
			if(op.loadingText) $('<div id="related-posts-loadingtext">'+op.loadingText+'</div>').appendTo(div);
			// Appending UL with loading class if selected
			ul= $('<ul '+(op.loadingClass? 'class="'+ op.loadingClass+'"':'')+'></ul>').appendTo(div);
			
			//recent posts
			if(op.tags.length==0){
				$.ajax({url:op.blogURL+'/feeds/posts/summary/'
						,data:{'max-results':op.maxPostsPerTag,'alt':'json-in-script'}
						,success:tagLoaded
						,dataType:'jsonp'
						,cache:true });
			// Tags found , do related posts widget
			}else{
				// Requesting json feeds for each tag    
				for(var t=0; t<op.tags.length;t++) 
					$.ajax({url:op.blogURL+'/feeds/posts/summary/'
							,data:{'category':op.tags[t],'max-results':op.maxPostsPerTag,'alt':'json-in-script'}
							,success:tagLoaded
							,dataType:'jsonp'
							,cache:true });
			}; 
		};
		// Call init on document ready
		if(op.onLoad) $(window).load(initRelatedPosts);
		else $(document).ready(initRelatedPosts);
	})(jQuery);  	
}

