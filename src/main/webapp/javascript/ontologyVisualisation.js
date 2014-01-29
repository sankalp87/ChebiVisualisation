/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
var labelType, useGradients, nativeTextSupport, animate;

var count =0, 
newCount =0;
	

(function() {
    var ua = navigator.userAgent,
    iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
    typeOfCanvas = typeof HTMLCanvasElement,
    nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
    textSupport = nativeCanvasSupport 
    && (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
    //I'm setting this based on the fact that ExCanvas provides text support for IE
    //and that as of today iPhone/iPad current text support is lame
    labelType = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
    nativeTextSupport = labelType == 'Native';
    useGradients = nativeCanvasSupport;
    animate = !(iStuff || !nativeCanvasSupport);
})();

var Log = {
    elem: false,
    write: function(text){
        if (!this.elem) 
            this.elem = document.getElementById('log');
        this.elem.innerHTML = text;
        if(text == "done"){
            this.elem.style.display = "none";
        }
        this.elem.style.left = (500 - this.elem.offsetWidth / 2) + 'px';
    }
};

var fd;

var lineStart = '',
lineEnd = '',
color;

function init(){

    //Data is loaded from server
    loadData();

    // init ForceDirected
    fd = new $jit.ForceDirected({
        //id of the visualization container
        injectInto: 'infovis',
        width: canvasWidth(),
        height: canvasHeight(),
        // height: screen.height*0.80,
        //canvasHeight(),
        withLabels: true,
        //Enable zooming and panning
        //with scrolling and DnD
        Navigation: {
            enable: true,
            type: 'Native',
            panning: 'avoid nodes',
            zooming: 10 
        },
        Node: {
            //  overridable: true,
            overridable: true,
            type: 'rectangle',
            dim: 7
        },
        Edge: {
            type: 'arrow',
            overridable: true,
            color: '#a1c7c7',
            lineWidth: 2
        },
        Label: {
            overridable: true
        },
        Tips: {  
            enable: true,  
            type: 'HTML',  
            offsetX: 10,  
            offsetY: 10,  
            onShow: function(tip, elem) {  
                //This is a tooltip for hover edges.
                if(!elem.name){
                    tip.hidden = true;
                    //Creates a different content based on the lineWidth and color of the arrow.
                    if((elem.nodeFrom.getData('alpha') != 0 ) && (elem.nodeTo.getData('alpha') != 0 )){ 
                        var content = (elem.getData('lineWidth') == 5) ? '<hr />This line has hidden paths. Click to expand.' : '';
                        var direction = elem.getData('direction');
                        var fromNode = fd.graph.getNode(direction[0]);
                        var toNode = fd.graph.getNode(direction[1]);
                        color =elem.getData('color');
                        var arrowColor = (color == '#000000') ? ' has part ' : ' is a ';
                        var root = (toNode.name =="chemical entity" || toNode.name == "role" || toNode.name == "subatomic particle") ?' (The root entity)' : '';
                        var relation = '<b> Relation </b> : ' +fromNode.name+'<b>'+arrowColor +'</b>' +toNode.name+root;
                        tip.innerHTML = relation + content ;
                        lineStart = direction[0];
                        lineEnd = direction[1];
                    	
                        //changes the line color to yellow from layout colors.
                        elem.setData('color','#feba12');
                        tip.hidden =false;
                        tip.style.display = '';
                        fd.fx.animate({
                            modes: ['edge-property:color'],
                            duration: 86400000
                        });  
                    } 
                } else{
                    tip.hidden = true;
                }
            },
            onHide: function(){
                fd.tips.tip.hidden = true;
            }
        },  
        // Add node events
        Events: {
            enable: true,
            enableForEdges: true,
            type: 'Native',
            //Change cursor style when hovering a node
            onClick: function(elem, eventInfo, e) {
                //                console.log('onClick funtion is executed');
                var positionOfEdge =  $jit.util.event.getPos(e);
                //                console.log(positionOfEdge.x+', '+positionOfEdge.y);
                var edgeSelected = eventInfo.getEdge(); 
                var nodeSelected = eventInfo.getNode(); 
  				
                //Edge onclick throws the hidden routes based on lineWidth and visiblity (alpha)
  					              
                if(edgeSelected != false && edgeSelected.getData('lineWidth') == 5  && edgeSelected.getData('alpha') == 1){
                    edgeSelected.setData('alpha', '0');
                    //All the thick lines stores a flaged data whose visibility
                    //will be changed from 0 to 1 (i.e. invisible to visible) 
                    //with a close button to bring back to its original position.
                    
                    var toNode = edgeSelected.getData('flag');       
                    toNode = toNode.split(',');
                    for(count = 0; count < toNode.length;count++){
                        toNode[count]= fd.graph.getNode(toNode[count]);
                        toNode[count].setData('alpha', 1);
                        var label = fd.labels.getLabel(toNode[count].id);
                        var labelStyle = label.childNodes[0].style;
                        var closeStyle = label.childNodes[1].style;
                        labelStyle.fontSize = "1.0em";
                        closeStyle.display = "";
                    }
                    fd.fx.animate({
                        modes: ['node-property:alpha',
                        'edge-property:alpha'],
                        duration: 86400000
                    });                    
                    
                }
                
                //Nodes onclick throws a tooltip with compound information with structure, definition and mass based on alpha.
                else if(nodeSelected !=false && nodeSelected.getData('alpha') == 1){
                    var element = document.getElementById('linkDivElem');
                    element.style.fontSize = "0.85em";
                    var positionOfNode =  $jit.util.event.getPos(e);
                    var def = elem.getData('def');
                    var structure = elem.getData('cId');
                    if(def.length > 4){
                        var definition = '<hr /><b>Definition</b> : '+def; 
                    } else{
                        definition = ''; 
                    }
                    var img=  new Image() ;
                    img = document.createElement('img');
                    img.src= 'http://www.ebi.ac.uk/chebi/displayImage.do?defaultImage=true&imageIndex=0&chebiId='+structure+'&dimensions=200';
                    element.appendChild(img);
                    var formula = (elem.getData('formula').length > 0)?('<hr /><b>Formula</b> : '+elem.getData('formula')) : '';
                    var mass =  (elem.getData('mass').length > 0 && 'null' != elem.getData('mass') ) ?('<hr /><b>Mass</b> : '+elem.getData('mass') ): '';
                    var win = {
                        'height': document.body.clientHeight,
                        'width': document.body.clientWidth
                    };
                    var obj = {
                        'width': 0,
                        'height': 0  
                    };
                    var x = 25, y = 0;
                    y = mass.length > 0 ? 200:-25;
                    
                    //These positions of the tooltip is based on the node position.
                    
                    element.style.top = (((positionOfNode.y + y + obj.height > win.height)?
                        (positionOfNode.y - obj.height - y) : positionOfNode.y + y)) + 'px';
                    element.style.left = ((positionOfNode.x + obj.width + x > win.width)? 
                        (positionOfNode.x - obj.width - x) : positionOfNode.x + x) + 'px';
                    img.onload = function (){
                        var url = '<hr /><img src="http://www.ebi.ac.uk/chebi/displayImage.do?defaultImage=true&imageIndex=0&chebiId='+structure+'&dimensions=200">';
                        element.innerHTML = '<b>'+'<a href="http://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:'+structure+'" class = "linkDE" text-Decoration = "none" >'+elem.name.charAt(0).toUpperCase() + elem.name.slice(1) +'</a>'+
                        '</b><img class="close" src="images/close.png" title="close" align="right" onclick= closeBlock() />'+definition+url+formula+mass;

                        element.style.top = (((positionOfNode.y + y + obj.height > win.height)?
                            (positionOfNode.y - obj.height - y) : positionOfNode.y + y)-200) + 'px';
                    }
                    img.onerror =function (){
                        element.innerHTML = '<b>'+'<a href="http://www.ebi.ac.uk/chebi/searchId.do?chebiId=CHEBI:'+structure+'" class = "linkDE" text-Decoration = "none" >'+elem.name.charAt(0).toUpperCase() + elem.name.slice(1) +'</a>'+
                        '</b><img class="close" src="images/close.png" title="close" align="right" onclick= closeBlock() />'+definition+formula+mass;
                    } 
                    element.style.display = '';	
                    
                }
                else {
                    closeBlock();
                }
            },
            onMouseEnter: function(event, eventInfo, e) {
                fd.canvas.getElement().style.cursor = 'pointer';
                var edgeSelected = eventInfo.getEdge();
                var config = fd.config.Tips;
                
                //Edge onhover throws a tooltip with information of relation between 
                //the nodes and hints about the hidden pathway (if lineWidth is 5).
                if(edgeSelected && edgeSelected.getData('alpha') == 1){
                    var positionOfEdge =  $jit.util.event.getPos(e);
                    var tip = fd.tips.tip;
                    var win = {
                        'height': document.body.clientHeight,
                        'width': document.body.clientWidth
                    };
                    var obj = {
                        'width': tip.offsetWidth,
                        'height': tip.offsetHeight  
                    };
                    var x = config.offsetX, y = config.offsetY;
                    //Position of the Edge is taken for the position of the tooltip with an offset.
                    tip.style.top = ((positionOfEdge.y + y + obj.height > win.height)?  
                        (positionOfEdge.y - obj.height - y) : positionOfEdge.y + y) + 'px';
                    tip.style.left = ((positionOfEdge.x + obj.width + x > win.width)? 
                        (positionOfEdge.x - obj.width - x) : positionOfEdge.x + x) + 'px';
                    config.onShow(tip, edgeSelected);
                }
                else {
                    config.onHide();
                }
            },
            
            onMouseLeave: function() {
                //if mouse leaves the edges the yellow is brought back to original color.
                if(lineStart.length > 0) {
                    var adjacent = fd.graph.getAdjacence(lineStart,lineEnd);
                    if(adjacent.getData('color') != ('#a1c7c7' || '#000000') ){
                        adjacent.setData('color', color);
                        fd.fx.animate({
                            modes: ['edge-property:color'],
                            duration: 86400000
                        });
                    }
                }
                fd.canvas.getElement().style.cursor = '';
            },
            
            //Update node positions when dragged
            onDragMove: function(node, eventInfo, e) {
                var pos = eventInfo.getPos();
                node.pos.setc(pos.x, pos.y);
                fd.fx.plot();
            }
           
        },
        //Number of iterations for the FD algorithm
        iterations: 200,
        //Edge length
        levelDistance: 130,
        // This method is only triggered
        // on label creation and only for DOM labels (not native canvas ones).
        onCreateLabel: function(domElement, node){
            // Create a 'name' and 'close' buttons and add them
            // to the main node label
            var nameContainer = document.createElement('div'),
            style = nameContainer.style;
            nameContainer.className = 'name';
            nameContainer.innerHTML = node.name;
            domElement.appendChild(nameContainer);
            
            //image element for the close button to hide edges
            var closeButton = document.createElement('img');
            closeButton.src="images/close.png";
            closeStyle = closeButton.style;
            closeButton.title = "Hide this pathway";
            closeButton.className = 'close';
            
            if(node._depth == 0){
                // This is a additional tooltip for compound information with a link to entry page.
                var linkDivElem = document.createElement('div');
                style = linkDivElem.style;
                linkDivElem.id = 'linkDivElem';
                linkDivElem.className = 'linkDE';
                style.position= 'absolute',
                style.display= 'none',
                style.zIndex= 13000;
                document.body.appendChild(linkDivElem);
                
                var childRelations =[]
                fd.graph.eachNode( function(node) {	
                    if(node._depth == -1){
                        childRelations.push(node.id);
                    }
                });
                
                //Another image element to display the children relationships if exist.
                if(childRelations.length >=1){
                    node.setData('flag',childRelations.toString());
                    //                    console.log('child flag: '+ node.getData('flag'));
                    var linkRelationButton =document.createElement('a');
                    linkRelationButton.className = 'expand';
                    domElement.appendChild(linkRelationButton);
                    var childRelationButton = document.createElement('img');
                    childRelationButton.src="images/expand.png";
                    childRelationButton.id = 'expand';
                    childRelationButton.textContent = '+';
                    childRelationButton.title = "Expand the children relationships of this entry";
                    linkRelationButton.appendChild(childRelationButton);
                    
                    //As Default, children relationships are hided with an option to display.
                    linkRelationButton.onclick = function() {
                        var elem = document.getElementById('expand');
                        if(elem.textContent == '+') {
                            //Hided relationships are displayed using the flag data stored in the root node.
                            elem.src="images/collapse.png";
                            elem.textContent = '-';
                            elem.title = "Hide the children relationships of this entry";
                            var nodeFlagData = fd.graph.getNode(fd.root).getData('flag');
                            nodeFlagData = nodeFlagData.split(',');
                            for(count=0; count < nodeFlagData.length;count++){
                                var node = fd.graph.getNode(nodeFlagData[count]);
                                node.setData('alpha',1);
                                var label = fd.labels.getLabel(node.id);
                                var labelStyle = label.childNodes[0].style;
                                labelStyle.fontSize = "1.0em";
                            }
                            fd.fx.animate({
                                modes: ['node-property:alpha',
                                'edge-property:alpha'],
                                duration: 86400000
                            });
                        } else if (elem.textContent == '-'){
                            //Displayed relationships are hided using the flag data stored in the root node.
                            elem.src="images/expand.png";
                            elem.textContent = '+';
                            elem.title = "Expand the children relationships of this entry";
                            nodeFlagData = fd.graph.getNode(fd.root).getData('flag');
                            nodeFlagData = nodeFlagData.split(',');
                            for(count=0; count < nodeFlagData.length;count++){
                                node = fd.graph.getNode(nodeFlagData[count]);
                                node.setData('alpha',0);
                                label = fd.labels.getLabel(node.id);
                                labelStyle = label.childNodes[0].style;
                                labelStyle.fontSize = "0.0em";
                            }
                            fd.fx.animate({
                                modes: ['node-property:alpha',
                                'edge-property:alpha'],
                                duration: 86400000
                            });
                        }
                    }; 
                }
            }
           
            // if nodes is invisible the label is created and placed
            // with zero font size and close button appended.
            if(node.getData('alpha') == 0){
                closeStyle.display="none";
                domElement.appendChild(closeButton);
                style.fontSize = "0.0em";
            } else {
                style.fontSize = "1.0em";
            }
            style.color = "#000";
        
            closeButton.onclick = function() {
                //Close button hides the nodes bring the thick line (lineWidth of 5) back.
                var nodeFlagData = node.getData('flag');
                nodeFlagData = nodeFlagData.split(',');
                var adjacent = fd.graph.getAdjacence(nodeFlagData[0],nodeFlagData[1]);
                adjacent.setData('alpha', 1);
                var adjacentFlagData = adjacent.getData('flag');
                adjacentFlagData = adjacentFlagData.split(',');
                for(count=0; count < adjacentFlagData.length;count++){
                    adjacentFlagData[count]= fd.graph.getNode(adjacentFlagData[count]);
                    adjacentFlagData[count].setData('alpha',0);
                    var label = fd.labels.getLabel(adjacentFlagData[count].id);
                    var labelStyle = label.childNodes[0].style;
                    var closeStyle = label.childNodes[1].style;
                    labelStyle.fontSize = "0.0em";
                    closeStyle.display = "none";
                }
                fd.fx.animate({
                    modes: ['node-property:alpha',
                    'edge-property:alpha'],
                    duration: 86400000
                });

            };
        },
        // Change node styles when DOM labels are placed
        // or moved.
        onPlaceLabel: function(domElement, node){
            var style = domElement.style;
            var left = parseInt(style.left);
            var top = parseInt(style.top);
            var w = domElement.offsetWidth;
            style.left = (left - node.getData('width')/2*0.7) + 'px';
            style.top = (top-10) + 'px';
            style.display = '';
        },
      
        onBeforePlotNode: function(node){
            var nodeLen = node.name.length;
            node.setData('width',nodeLen*8);
        },
        
        onBeforePlotLine: function(adj){
            if((adj.nodeFrom.getData('relation') || adj.nodeTo.getData('relation')) == "has_part"){
                adj.setData('color','#000000');
            }
        }

    });
    // load JSON data.
    fd.loadJSON(json);
    // compute positions incrementally and animate.
    fd.computeIncremental({
        iter: 40,
        property: 'end',
        onStep: function(perc){
            Log.write(perc + '% loaded...');
        },
        onComplete: function(){
    	
            //checking for the nodes positions
            positioningNodes();
			
            //simplified version
            simplifiedGraph();
			
            Log.write('done');
            
            fd.animate({
                modes: ['linear'],
                //    transition: $jit.Trans.Elastic.easeOut,
                duration: 2500
            });
            fd.canvas.scale(0.8, 0.8); 
            fittingCanvas();
        }
    });
// end
}
 
function closeBlock() {
    var element = document.getElementById('linkDivElem');
    element.style.display = 'none';
}

function sortMultiDimensional(a,b) {
    // this sorts the array using the second element    
    return ((a[1] < b[1]) ? -1 : ((a[1] > b[1]) ? 1 : 0));
}

//for the simplification of graphs which shows only the nodes that has multiple parents or children.
function simplifiedGraph(){
    fd.graph.eachNode(function(node) {
        //        console.log(node.name);
        var nodesConnected = [];
        // get the connected nodes to find the parent and child nodes by ID.
        node.eachAdjacency(function(adj) {
            nodesConnected.push(fd.graph.getNode(adj.nodeTo.id)); 
        }); 
        
        //node is made invisible if it has two connections and node is not 
        //either top or bottom root nodes.
        if(nodesConnected.length == 2 && node._depth !=0 && node.name != 'role' && node.name != 'chemical entity' && node.name != 'subatomic particle'){
            node.setData('alpha',0);
            var parentNode = node.getParents();
            var childNode;
            var flagId = []; 
            flagId.push(node.id);
            parentNode = parentNode[0];
            
            // find the child node by ID
            if(parentNode.id == nodesConnected[0].id ){
                childNode = nodesConnected[1];
            }
            else {
                childNode = nodesConnected[0];
            }
             		
            var nodesConnectedToPar = []; 
            var nodesConnectedToChild = [];
            //            console.log(parentNode.id+', '+childNode.id);
            		
            parentNode.eachAdjacency(function(adj) {
                nodesConnectedToPar.push(fd.graph.getNode(adj.nodeTo.id)); 
            }); 
            //            console.log(parentNode.id+' has '+nodesConnectedToPar.length +' adj');

            childNode.eachAdjacency(function(adj) {
                nodesConnectedToChild.push(fd.graph.getNode(adj.nodeTo.id)); 
            });
            //            console.log(childNode.id+' has '+nodesConnectedToChild.length+' adj');
                	
            if(nodesConnectedToPar.length ==2){
                while(nodesConnectedToPar.length ==2 && parentNode._depth != 0){
                    flagId.push(parentNode.id);
                    parentNode = parentNode.getParents();
                    parentNode = parentNode[0];
                    nodesConnectedToPar = [];
                    parentNode.eachAdjacency(function(adj) {
                        nodesConnectedToPar.push(fd.graph.getNode(adj.nodeTo.id)); 
                    }); 
                }
            }
            		
            if(nodesConnectedToChild.length == 2 ){
                while(nodesConnectedToChild.length == 2 && childNode._depth != 0 && childNode.name != 'role'
                    && childNode.name != 'chemical entity' && childNode.name != 'subatomic particle'){
                    flagId.push(childNode.id);
                    for(count =0; count<flagId.length; count++){
                        for(newCount = 0; newCount < nodesConnectedToChild.length; newCount++){
                            if( flagId[count] == nodesConnectedToChild[newCount].id){
                                //                                console.log(nodesConnectedToChild[newCount].id +' is removed');
                                nodesConnectedToChild.splice(newCount,1);
                            }
                        }
                    }
                    childNode = nodesConnectedToChild[0];
                    //                    console.log(childNode.id+' is child node now');

                    nodesConnectedToChild = [];
                    childNode.eachAdjacency(function(adj) {
                        nodesConnectedToChild.push(fd.graph.getNode(adj.nodeTo.id));           
                    });
                //                    console.log(childNode.id+' has '+nodesConnectedToChild.length+' adj');
                }

            }
            //            console.log(parentNode.id+' has '+nodesConnectedToPar.length +' adj');
            //            console.log(childNode.id+' has '+nodesConnectedToChild.length+' adj');
                	
                    
            if(!parentNode.adjacentTo(childNode)){   
                //                console.log('Adding adjacence' + childNode.id+','+parentNode.id);
                for(count =0; count<flagId.length; count++){
                    var flagNodeData = fd.graph.getNode(flagId[count]);
                    var flagData = parentNode.id+','+childNode.id;
                    flagNodeData.setData('flag',flagData);
                    flagNodeData.setData('invisible','true');
                }
                //                console.log('flag: '+ flagId.toString());
                fd.graph.addAdjacence(parentNode,childNode,{
                    "$direction": [parentNode.id,childNode.id],
                    "$type" : 'arrow',
                    "$alpha" : 1,
                    "$lineWidth": 5,
                    "$flag": flagId.toString()
                });      
            }
            else{
                //                console.log('It is already adjacent.');
                var adjacent = fd.graph.getAdjacence(parentNode.id,childNode.id);
                //                console.log(parentNode.name+', '+childNode.name);
                var adjacentFlagData = adjacent.getData('flag');
                if(adjacentFlagData == 0){
                    //                    console.log(flagId.toString());
                    adjacent.setData('lineWidth','5');
                    adjacent.setData('alpha', 1);
                    adjacent.setData('flag',flagId.toString());
                    for(count =0; count<flagId.length; count++){
                        flagNodeData = fd.graph.getNode(flagId[count]);
                        flagData = parentNode.id+','+childNode.id;
                        flagNodeData.setData('flag',flagData);
                    //                        console.log(flagId[count]+ ' has data '+flagNodeData.getData('flag'));
                    }
                }
                else{
                    adjacentFlagData = adjacentFlagData.split(',');
                    //                    console.log('Checking for flagData.')
                    for(count =0; count<flagId.length; count++){
                        for(newCount = 0; newCount < adjacentFlagData.length; newCount++){
                            if( flagId[count] == adjacentFlagData[newCount]){
                                //                                console.log(adjacentFlagData[newCount]+' is removed' );
                                adjacentFlagData.splice(newCount,1);
                        		
                            }
                        }
                    } 
                    if(adjacentFlagData.length > 0){
                        //                        console.log('it has more than one route');
                        for(count =0; count<adjacentFlagData.length; count++){
                            flagId.push(adjacentFlagData[count]);
                            flagNodeData = fd.graph.getNode(adjacentFlagData[count]);
                            flagData = parentNode.id+','+childNode.id;
                            flagNodeData.setData('flag',flagData);
                            flagNodeData.setData('invisible','true');
                        //                            console.log(adjacentFlagData[count]+ ' has data '+flagNodeData.getData('flag'));
                        }
                        adjacent.setData('flag',flagId.toString());
                    }
                }
                        
                        
            }
        }
     	
    });
    childrenNodesPositioning();        
}

//check for the position of the nodes and make sure that no node collide each other.
function positioningNodes(){

    var depthArray = new Array();
    var childRelations = [];
    fd.graph.eachNode( function(node) {
    
        if(depthArray[node._depth] == undefined &&  node._depth >= 0){
            depthArray[node._depth] = node.id;
        } else {
            if(node._depth < 0 ){
                childRelations.push(node.id);  	
            } else {
                depthArray[node._depth] = depthArray[node._depth] +','+node.id; 
            }
        }
    });
    
    var widthOfCanvas = screen.width*0.7;
    var heightOfCanvas = fd.config.height;
    var heightOfLine = (childRelations.length >= 1) ?heightOfCanvas/(depthArray.length + 1) : heightOfCanvas/depthArray.length;	
    fd.graph.eachNode( function(node) {
        var pos = node.getPos('end');
        pos.y =  heightOfCanvas/2 - node._depth*heightOfLine;
    });
    //    console.log('checking positioning');
    
    //    console.log('array of depth with id are created');
    var otherRoot = depthArray[depthArray.length -1 ].split(','); 
  			
    //moving the root entity on the top
    if(otherRoot.length != 1){
        //        console.log('root entity has moved to top most');
        for(count = 0; count < otherRoot.length;count++){
            if(otherRoot[count].indexOf("24431") != -1 || otherRoot[count].indexOf("50906") != -1  || otherRoot[count].indexOf("36342") != -1) {
                var otherRootNode =fd.graph.getNode(otherRoot[count]);
                pos = otherRootNode.getPos('end');
                pos.y = pos.y - heightOfLine;
                depthArray.push(otherRoot[count]);
                otherRoot.splice(count,1);
            }					  
        }
        otherRoot = otherRoot.toString();
        depthArray[depthArray.length-2] = otherRoot;
    }
    
    //	var canvasWidth = screen.width*0.80;
  			
    for(count = 1;count < depthArray.length-1; count++){
        // getting the nodes in the each depth and checking for the spaces..
        var nodes = depthArray[count].split(','); 
        //        console.log('depth :'+count+ 'has ' + nodes.length + 'nodes' );
        if(nodes.length >1) {
            //            console.log('checking width for depth :'+count);
            // create a array with node and X position
            var nodesPos = new Array (nodes.length);
            for(newCount=0; newCount < nodes.length;newCount++){
                nodesPos[newCount] =  new Array(2);
                nodesPos[newCount][0] = nodes[newCount];
                nodesPos[newCount][1] = fd.graph.getNode(nodes[newCount]).getPos('end').x;
            }
            // sorting the nodes with X position
            nodesPos.sort(sortMultiDimensional);
  				
            var nodeWidth = (nodes.length - 1) * 25;	
            for(newCount = 1; newCount < nodesPos.length - 1; newCount++){
                nodeWidth = nodeWidth + Math.abs(nodesPos[newCount -1][1] - nodesPos[newCount][1] );
            }
            //            console.log ( nodeWidth+', '+ widthOfCanvas)
  				
            // if width does not fit within the canvas the 
            // move the first and last one half level higher.
            var nodeFlag =false;
            if(nodeWidth > widthOfCanvas){
                //                console.log('moving some nodes to top due to space issues');
                pos = fd.graph.getNode(nodesPos[0][0]).getPos('end');
                pos.y = pos.y - screen.height*0.07/2;
                pos = fd.graph.getNode(nodesPos[nodes.length - 1 ][0]).getPos('end');
                pos.y = pos.y - screen.height*0.07/2;
                nodeFlag = true;
            }
				
            //checking for the nodes spaces in between
				
            var initialCount = (nodeFlag) ? 1 : 0 ;
            var finalCount = (nodeFlag) ? nodesPos.length - 3 : nodesPos.length - 1;
            nodesPositionWithSpace(initialCount,finalCount,nodesPos);
            nodeFlag =false;
        }
    }
  	
    if(childRelations.length >= 1){
        nodesPos = fd.graph.getNode(fd.root).getPos('end');
        if(childRelations.length > 7){
            
            for(count =0; count<childRelations.length; count++){
                var childNodePos = fd.graph.getNode(childRelations[count]).getPos('end');
            
                childNodePos.x= nodesPos.x +(count+1)*50+300;
                childNodePos.y = nodesPos.y+(count+1)*50;
            }
            
        }else {
        for(count =0; count<childRelations.length; count++){
            childNodePos = fd.graph.getNode(childRelations[count]).getPos('end');
            if(count == 0){
                childNodePos.x = nodesPos.x+10; 
            }
            else if(count < childRelations.length/2){
                //                console.log(childRelations[count]+', '+(childRelations[count].length*8*count+50));
                childNodePos.x = - (100*count+100); 
            }
            else if(count >= childRelations.length/2){
                //                console.log(childRelations[count]+', '+(childRelations[count].length*8*count/2+50));
                childNodePos.x =100*count/2+100 ; 
            }
        }
        nodesPos = new Array (childRelations.length);
        for(newCount = 0; newCount < nodesPos.length; newCount++){
            nodesPos[newCount] =  new Array(2);
            nodesPos[newCount][0] = childRelations[newCount];
            nodesPos[newCount][1] = fd.graph.getNode(childRelations[newCount]).getPos('end').x;
        }
        nodesPos.sort(sortMultiDimensional);    
        nodesPositionWithSpace(0,nodesPos.length-1,nodesPos);
    }
    }
  	
}

//slider zoom get values of the slide and scales according to that value.
var lastValue = 1;
function sliderWithZoom(newValue){
    var ans = newValue/lastValue;
    fd.canvas.scale(ans, ans);
    lastValue = newValue;
}

//move function moves the canvas completely on the direction.
function panningMove(val){
    var x, y;
    switch (val){
        case 1:
           x = 0, y = 30;
            break;
        case 2:
            x = 30, y = 0;
            break;
        case 3:
            x = 0, y = -30;
            break;
        case 4:
            x = -30, y = 0;
    }
    fd.canvas.translate(x,y);	
}

//full graph without any simplication of graph (Extended view).
function originalView(){
    fd.graph.eachNode(function(node) {
        if(node._depth == 0 && node.getData('flag') != 0){
            var elem = document.getElementById('expand');
            elem.textContent = '-';
            elem.src="images/collapse.png";
            elem.title = "Hide the children relationships of this entry";
        }
        //        console.log(node.name + ': '+ node.getData('alpha'));
        if(node.getData('alpha') == 0){
            node.setData('alpha', 1);
            var label = fd.labels.getLabel(node.id);
            label.childNodes[0].style.fontSize = "1.0em";
        }
        node.eachAdjacency(function(adj){
            if(adj.getData('lineWidth') == 5){
                adj.setData('alpha', 0);
            } 
        });
    });
    fd.fx.animate({
        modes: ['node-property:alpha',
        'edge-property:alpha'],
        duration: 86400000
    });    
}

//simplified graph is brought back (Compact view).
function simplifiedView(){
    fd.graph.eachNode(function(node) {
        if(node._depth == 0 && node.getData('flag') != 0){
            var elem = document.getElementById('expand');
            elem.textContent = '+';
            elem.src="images/expand.png";
            elem.title = "Expand the children relationships of this entry";
            var nodeFlagData = fd.graph.getNode(fd.root).getData('flag');
            nodeFlagData = nodeFlagData.split(',');
            for(count=0; count < nodeFlagData.length;count++){
                node = fd.graph.getNode(nodeFlagData[count]);
                node.setData('alpha',0);
                var label = fd.labels.getLabel(node.id);
                var labelStyle = label.childNodes[0].style;
                labelStyle.fontSize = "0.0em";
            }        	
        }    
	
        var visible =  node.getData('invisible');
        if(visible){
            node.setData('alpha', 0 );
            label = fd.labels.getLabel(node.id);
            label.childNodes[0].style.fontSize = "0.0em";
            label.childNodes[1].style.display = "none";
        }
        node.eachAdjacency(function (adj) {
            adj.setData('alpha',1);
        });
    });
    fd.fx.animate({
        modes: ['node-property:alpha',
        'edge-property:alpha'],
        duration: 86400000
    }); 

}

//canvas height is automatically changed according to the data
function canvasHeight(){
    var height = json;
    var heightOfCanvas;
        outer : for(count in height){
            //     console.log(height[count].name);
            if(height[count].name == "chemical entity" || height[count].name == "role" || height[count].name == "subatomic particle" ){
                heightOfCanvas = height[count].data.$nodeDepth;
                heightOfCanvas = heightOfCanvas*80*0.6;
                break outer;
            }
        }
    if(heightOfCanvas < 200 ) {
        heightOfCanvas = 200;
    }
	
    return heightOfCanvas;
}

//canvas width is automatically changed according to the data
function canvasWidth(){
var theWidth;
if (window.innerWidth) {
theWidth=window.innerWidth;
}
else if (document.documentElement && document.documentElement.clientWidth) {
theWidth=document.documentElement.clientWidth;
}
else if (document.body) {
theWidth=document.body.clientWidth;
}
return theWidth*0.80;
}

//trying to centralise based on the expanded mode
function fittingCanvas(){
    //    console.log('fitting canvas');
    var xMin = 0 ; 
    fd.graph.eachNode( function(node) {	
        var nodePos = node.getPos('end');
        //        console.log(node.name+': '+nodePos.x);
        xMin = xMin < nodePos.x ? xMin : nodePos.x;
    });
    xMin = xMin + fd.config.width/2 ;
    //    console.log(xMin+', '+fd.config.width/2 ); 
    if(xMin > 100 ){ 
        fd.canvas.translate(-(xMin-100),-100);
    }
}

//The graph is broken here because of node depth -1 (which is not allowed by the layout)
// achieved by changing the direction of connection, so those are connected again with required info
function childrenNodesPositioning(){
    fd.graph.eachNode( function(node) {
        var rootNode = fd.graph.getNode(fd.root);
        if(node._depth == -1){
            fd.graph.addAdjacence(node,rootNode,{
                "$direction": [node.id,rootNode.id],
                "$type" : 'arrow',
                "$alpha" : 1,
                "$lineWidth": 2                    
            }); 
            node.setData('alpha',0);         
        }
    });

}

//To check the spaces between the nodes, if there is a collision/less space
//adjust the nodes accordingly.
function nodesPositionWithSpace(initialCount,finalCount,nodesPos){
    //nodesPos has two values one with position of X and other with node ID
    for(newCount = initialCount; newCount < finalCount; newCount++ ){
        
        var node = fd.graph.getNode(nodesPos[newCount][0]);
        var adjNode = fd.graph.getNode(nodesPos[newCount+1][0]);
        var pos = node.getPos('end');
        var adjNodePos = adjNode.getPos('end');
        //        console.log(node.name+' : '+ pos.x+','+ adjNode.name +' : '+ adjNodePos.x);
  					
        if(pos.x > adjNodePos.x){
            //          console.log('adjNodePos.x'+adjNodePos.x);
            adjNodePos.x = (Math.abs ((Math.abs(pos.x - adjNodePos.x))+ 10) + adjNodePos.x)  ;
        //        	console.log('adjNodePos.x'+adjNodePos.x);
        }
						  				
        var actWidth = node.name.length*8/2 + adjNode.name.length*8/2 +25;
        var obsWidth = Math.abs(pos.x - adjNodePos.x);
        //        console.log(' actWidth '+ actWidth+', obsWidth '+ obsWidth);
        var reqWidth = Math.abs(obsWidth - actWidth);
        if(obsWidth < actWidth ) {
            //	pos.x = reqWidth/2 + pos.x;
            adjNodePos.x = reqWidth + adjNodePos.x; 
        //            console.log(adjNode.name +' has moved to : '+ adjNodePos.x);
        }
    }
}


