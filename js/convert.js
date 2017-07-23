'use strict';


//Libraries import
var core = require("./flux/core.js");
var revit = require('./flux-modelingjs/src/revit');
//var list = require("./flux/list.js");
var _ = require('./flux/lodash');


function run(Rhino) {
	
	var Scene = Rhino
	function LayerSort(Scene) {
		
		var Nb_Layers= Scene.length/3
		
		var i = 0
		var Layers_name = []
		for (i=2; i < Scene.length; i= i+3){
			Layers_name.push(Scene[i]['label'])	
		}
		
		
		var a= []
		var i = 0
		for (i=0; i < Scene.length; i= i+3){
			 a.push(i)
		}
		
		var j = 0
		var Level_layer_exist = 0
		var Floor_layer_exist = 0
		var Beam_layer_exist = 0
		var Column_layer_exist = 0
		for (j=0; j<Layers_name.length ; j++){
			
			if (Layers_name[j]== 'SLABS'){
				Layer_Floor = [Scene[a[Layers_name.indexOf('SLABS')]]]
				Floor_layer_exist = Floor_layer_exist +1
			}
			if (Layers_name[j]== 'LEVELS'){
				Layer_Level = [Scene[a[Layers_name.indexOf('LEVELS')]]]
				Level_layer_exist = Level_layer_exist+1
			}
			if (Layers_name[j]== 'WALLS'){
				Layer_Wall = [Scene[a[Layers_name.indexOf('WALLS')]]]
			}
			if (Layers_name[j]== 'BEAMS'){
				Layer_Beam = [Scene[a[Layers_name.indexOf('BEAMS')]]]
				Beam_layer_exist = Beam_layer_exist +1
			}
			if (Layers_name[j]== 'COLUMNS'){
				Layer_Column = [Scene[a[Layers_name.indexOf('COLUMNS')]]]
				Column_layer_exist = Column_layer_exist +1
			}
			if (Level_layer_exist==0){
				Layer_Level = 'undefined'
			}
			if (Floor_layer_exist==0){
				Layer_Floor = 'undefined'
			}
			if (Beam_layer_exist==0){
				Layer_Beam = 'undefined'
			}
			if (Column_layer_exist==0){
				Layer_Column = 'undefined'
			}
				
		}
		
		return{
			Layer_Level : Layer_Level,
			Layer_Floor : Layer_Floor,
			Layer_Wall : Layer_Wall,
			Layer_Beam : Layer_Beam,
			Layer_Column : Layer_Column
			
		}
	}

	var Layer_Level = LayerSort(Scene).Layer_Level
	var Layer_Floor= LayerSort(Scene).Layer_Floor
	var Layer_Wall = LayerSort(Scene).Layer_Wall
	var Layer_Beam = LayerSort(Scene).Layer_Beam
	var Layer_Column = LayerSort(Scene).Layer_Column
	
	//CREATE LEVELS---------------------------------------------------------------------------------------------------
	
	function CreateLevel(Levels, Floors) {
			
		//Function definition
		var getLevels = function(Levels, Floors) {
	//CASE 1 > Level From Levels
		  if (Levels != 'undefined'){
		  	
		    var getLevelFromLevels = function(Levels, Floors){
				
				//STEP 1 : check if same number of floors and levels
				//Finds list of all Floor height
				var fl_heights = []
				var len= Floors[0]['entities'].length
				for(var i = 0; i < len; i++){
		            fl_heights.push(Floors[0]['entities'][i]['curves'][0]['end'][2])
		          }
				
		        //initializes arrays
		        var HeightsList= []
		        var j = Levels[0]['entities'].length
				var i=0
				
		        //find list of heights in json
		        for (i=0; i<j; i++){
		          HeightsList.push(Levels[0]['entities'][i]['point'][2])
		        }
		        if (HeightsList.length < fl_heights.length){
		        	var all_levels = HeightsList.concat(fl_heights)
		        	HeightsList = all_levels.unique().sort(function(a,b) { return a - b; })
		        }
		
				
		        // Get array of Level names and associated heights ... ['Level 1':0, 'Level 2':4.5', etc...]
		        var getLevelList= function(HeightsList) {
				  HeightsList=	HeightsList.sort(function(a,b) { return a - b; })
		          var FloorsNb = HeightsList.length
		          var Level = "Level"
		          var LevelList =[]
		          for (i=0; i< FloorsNb; i++){
		            var array = []
		            array.push(Level+" "+(i+1))
		            array.push(HeightsList[i])
		            LevelList.push(array)
		
		          }
		          return(LevelList);
		        }
		        return getLevelList(HeightsList)
		    }
		    return getLevelFromLevels(Levels, Floors);
		  }
		
	//CASE 2 > Levels From Floors
		  if (Levels == 'undefined' && Floors != 'undefined'){

		    var getLevelFromFloors = function(Floors){
		    	
		        // Get Heights of each level
		        var getLevelHeights= function(Floors){
					
		          var len= Floors[0]['entities'].length
		          var heights =[]
		
		
		          for(i = 0; i < len; i++){
		            heights.push(Floors[0]['entities'][i]['curves'][0]['end'][2])
		          }
		
		          //Function to get unique values
		          Array.prototype.unique= function()
		          {    
		            var n = []; 
		            for(var i = 0; i < this.length; i++) 
		              {
		                if (n.indexOf(this[i]) == -1) n.push(this[i]);
		              }
		              return n;
		          }
		          
		          //GET UNIQUE HEIGHTS
		          var UniqueHeights= heights.unique()
		
		          return UniqueHeights;
		
		        }
		
		        // Get array of Level names and associated heights ... ['Level 1':0, 'Level 2':4.5', etc...]
		        var getLevelList= function(UniqueHeights) {
		
		          var SortedHeights = UniqueHeights.sort(function(a,b) { return a - b; })
		          var floors = UniqueHeights.length
		          var Level = "Level"
		          var LevelList =[]
		          for (i=0; i< floors; i++){
		            var array = []
		            array.push(Level+" "+(i+1))
		            array.push(SortedHeights[i])
		            LevelList.push(array)
		          }
		          return(LevelList);
		        }
		
		        var UniqueHeights = getLevelHeights(Floors)

		        return getLevelList(UniqueHeights)
		    }
		    
		    return getLevelFromFloors(Floors)
		    
		  }
		   
	//CASE 3 > No levels, no floors > Ground floor + Offset
		  //UNDERCONSTRUCTION
		  //requires Wall height for each individual wall
		  if ( Levels == 'undefined' && Floors == 'undefined' ) {
		    var getLevelFromGround= function(){
		      var LevelList= [["Level 1",0]]
		      //console.log(LevelList[0])
		      return LevelList
		      
		    }
		    return getLevelFromGround()
		  } 
		}
	
		//Use Functions to find Levels
		var Levels_list = getLevels(Levels, Floors)
		var Level_name = []
		var Level_heights = []
		var FluxId = []
		
		for ( i=0 ; i<Levels_list.length ;i++){
	
			Level_name.push(Levels_list[i][0])
			Level_heights.push(Levels_list[i][1])
			//FluxId.push(Levels[0]['entities'][i]['id'])
			
		}
		
		var len= Level_heights.length
		var Name= Level_name
		var Elevation= Level_heights
		var Type = "Story Level"
	    
	    var hasFluxId = !core.IsInvalid(FluxId);
	
	    var levels = [];
	    var elevation, fluxId, type, name, instParamMap, custParamMap;
	
	    for (var i = 0; i<len; i++) {
	        elevation = core.GetIndexOrLast(Elevation, i);
	        type = core.GetIndexOrLast(Type, i);
	        name = core.GetIndexOrLast(Name, i);
	        //instParamMap = core.GetIndexOrLast(InstanceParamMap, i);
	        //custParamMap = core.GetIndexOrLast(CustomParamMap, i);
			fluxId = core.GetIndexOrLast(FluxId, i);
	
	        var level = revit.createLevel(fluxId, type, elevation, name, instParamMap, custParamMap);
	
	        levels.push(level.Out);
	    }
	    var Levels_list = []
	    return {
	        levels,
	        Levels_list: getLevels(Levels, Floors)
	    };
	    
	}	
	
	var Levels = CreateLevel(Layer_Level, Layer_Floor).levels
	var Level_List = CreateLevel(Layer_Level, Layer_Floor).Levels_list
	
	//CREATE FLOORS----------------------------------------------------------------------------------------------------------------------
	
	function CreateFloors(Geometry, Level) {
	
		//FUNCTION > Get curves points
		function getEndPoints(Poly){
		
			//find nb of polycurves
			var nbCurves = Poly['0']['entities'].length
			//find 1 end points
			var nbPoints= Poly[0]['entities'][0]['curves'].length
		
			var EndPoints = []
			var StartPoints = []
			var i = 0
			for (i=0;i<nbCurves;i++){
				var EPoints=[]
				var SPoints=[]
				var j=0
				
				for (j=0;j<nbPoints;j++){
					EPoints.push(Poly[0]['entities'][i]['curves'][j]['end']),
					SPoints.push(Poly[0]['entities'][i]['curves'][j]['start'])
				}
				
				EndPoints.push(EPoints),
				StartPoints.push(SPoints);
				
				//FUNCTION > sort array of point based on height(low > top)
				 function Comparator(a, b) {
				  if (a[2] < b[2]) return -1;
				  if (a[2] > b[2]) return 1;
				  return 0;
				}
				//Sorts points array
		  		EndPoints= EndPoints.sort(Comparator);
		  		StartPoints= StartPoints.sort(Comparator);
			}
		
			return {
				End: EndPoints,
				Start: StartPoints
			}
		}
		
		//Retreives END and START for Rhino lines
		var EndPoints= getEndPoints(Geometry).End
		var StartPoints= getEndPoints(Geometry).Start
		
		//PROFILE LINES
		var Curves= []
		
		var CurveTemplate= {
		      "end": [
		      ],
		      "primitive": "line",
		      "start": [
		      ],
		      "units": {
		        "end": "feet",
		        "start": "feet"
		      }
		    }
		
		var PolycurveTemplate = {
		  "curves": [
		  ],
		  "primitive": "polycurve",
		  "units": "feet"
		}
		
		//Create Profile Array
		var Profiles = []
		
		//create deep copy function
		const copy = (o) => JSON.parse(JSON.stringify(o))
		var j=0
		
		//Creates profile lines
		for(j=0 ; j< EndPoints.length; j++){
		
			var Polycurve =copy(PolycurveTemplate);
			var i=0
			for (i=0;i<EndPoints[0].length;i++){
				var Curve = copy(CurveTemplate);
				Curve['end']= EndPoints[j][i]
				Curve['start']= StartPoints[j][i]
				Polycurve['curves'].push(Curve)
			}
			Profiles.push(Polycurve)
		}
		
		//Nesting Profile array
		var Nested_profiles = []
		var m=0
		for (m=0 ; m<Profiles.length  ;m++ ){
			Nested_profiles.push([Profiles[m]])
			
		}
		
	    //Create floors parameters
	    var fluxId, profile, level, family, type, structural, instParamMap, custParamMap;
		
		//Set Flux ID
		var FluxId= []
		for ( i=0 ; i<Geometry[0]['entities'].length ;i++){
			FluxId.push(Geometry[0]['entities'][i]['id'])
		}
		
		//Set TYPE
		//var Type= [ "Generic - 12\""]
		var Type= [ "Concrete Slab - 6\""]
	
		//Set Levels
		var len= Profiles.length
		var k=0
		var Curves_height = []
		var Levels_array= []
		for (k=0 ; k<len ; k++){
			var l =0
			var difference =[]
			for (l=0 ; l<Level.length ; l++){
				difference.push(Math.abs(Profiles[k]['curves'][0]['end'][2]-Level[l][1]))
				}
			Levels_array.push(Level[difference.indexOf(Math.min(...difference))][0])
		}
		
		//CREATES REVIT FLOORS
		var i=0
		var floors = []
		
		//INPUTS
		for (i=0 ; i<Profiles.length ; i++){ 
			
			fluxId = core.GetIndexOrLast(FluxId, i)
			type = core.GetIndexOrLast(Type, i)
			level = core.GetIndexOrLast(Levels_array, i)
			profile = core.GetIndexOrLast(Nested_profiles, i)
			
			var floor = revit.createFloor(fluxId, type, profile, level)
			floors.push(floor.Out)
		}
	    return {
	    	Floors: floors
	    }
	}
	
	if (Layer_Floor != 'undefined'){
		var Floors = CreateFloors(Layer_Floor, Level_List).Floors
	}
	
	//CREATE WALLS----------------------------------------------------------------------------------------------------------------------
	
	function CreateWalls(Geometry, Levels) {
	
		//Get individual wall height
		var Wall_heigths = []
		for (i=0; i<Geometry[0]['entities'].length; i++ ){
			Wall_heigths.push(Geometry[0]['entities'][i]['end'][2])
		}
		
		//Find level for each wall
		var len= Geometry[0]['entities'].length
		var k=0
		var Levels_array= []
		for (k=0 ; k<len ; k++){
			var l =0
			var difference =[]
			for (l=0 ; l<Levels.length ; l++){
				difference.push(Math.abs(Wall_heigths[k]-Levels[l][1]))
			}
			Levels_array.push(Levels[difference.indexOf(Math.min(...difference))][0])
		}
		
		//defines unique function
		Array.prototype.unique = function() {
		  return this.filter(function (value, index, self) { 
		    return self.indexOf(value) === index;
		  });
		}
		
		//Count unique levels
		var Unique_levels= Levels_array.unique()
		
		var counts = {};
		var i = 0
		for (var i = 0; i < Levels_array.length; i++) {
		    counts[Levels_array[i]]= 1 + (counts[Levels_array[i]] || 0);
		}
		
		var Wall_per_floor = []
		var j = 0
		for ( j=0; j<Unique_levels.length; j++){
			Wall_per_floor.push(counts[Unique_levels[j]])
		}
		
		//FluxId
		var FluxId= []
		for (i=0;i<len; i++){
			FluxId.push(Geometry[0]['entities'][i]['id'])
		}
		
		//Generates PROFILE LINE LIST
		var Profiles = []
		var k = 0
		for (k=0 ; k<len ; k++){
			Profiles.push(Geometry[0]['entities'][k])
		}
	    
	    //Assign Type
	    var Type = ["Generic - 12\""] 
	    
	    //Assign Family
	    var Family = ["Basic Wall"]
	    
	    
	    //Assign Instance Parameter
	    
	    var Top_Constraint = []
	    var i =0
	    for (i=0; i<Levels_array.length ;i++ ){
	    	var Nb = parseInt(Levels_array[i].substr(Levels_array[i].length - 1))+1
	    	var a= "{\"Top Constraint\": \"Level "+ Nb+ "\"}"
	    	var b= JSON.parse(a)
	    	Top_Constraint.push(b)
	    	
	    }
		
	    var walls = [];
	    
	    //Assign Structural & Flipped
	    var Structural = []
	    var Flipped = []
	    for (i=0; i<Levels_array.length ;i++ ){
	    	Structural[i]= true
	    	Flipped[i]= false
	    }
	    
	    
	    var fluxId, family, type, profile, level, structural, flipped, instParamMap, custParamMap;
	    
	    for (var i = 0; i<len; i++) {
	        fluxId = core.GetIndexOrLast(FluxId, i);
	        family = core.GetIndexOrLast(Family, i);
	        type = core.GetIndexOrLast(Type, i);
	        profile = core.GetIndexOrLast(Profiles, i);
	        level = core.GetIndexOrLast(Levels_array, i);
	        structural = core.GetIndexOrLast(Structural, i);
	        flipped = core.GetIndexOrLast(Flipped, i);
	        instParamMap = core.GetIndexOrLast(Top_Constraint, i);
	        // custParamMap = core.GetIndexOrLast(CustomParamMap, i);
	
	        var wall = revit.createWall(fluxId, family, type, profile, level, structural, flipped, instParamMap);
	        walls.push(wall.Out);
	    	}
			
		    return {
		       Walls: walls
	    	};
	}
	
	if (Layer_Wall != 'undefined'){
		var Walls = CreateWalls(Layer_Wall, Level_List).Walls
	}
	
	//CREATE BEAMS----------------------------------------------------------------------------------------------------------------------
	
	function CreateBeams(Geometry, Levels) {
		
			//Get individual wall height
			var Beam_heigths = []
			for (i=0; i<Geometry[0]['entities'].length; i++ ){
				Beam_heigths.push(Geometry[0]['entities'][i]['end'][2])
			}
			
			//Find level for each wall
			var len= Geometry[0]['entities'].length
			var k=0
			var Levels_array= []
			for (k=0 ; k<len ; k++){
				var l =0
				var difference =[]
				for (l=0 ; l<Levels.length ; l++){
					difference.push(Math.abs(Beam_heigths[k]-Levels[l][1]))
				}
				Levels_array.push(Levels[difference.indexOf(Math.min(...difference))][0])
			}
			
			//defines unique function
			Array.prototype.unique = function() {
			  return this.filter(function (value, index, self) { 
			    return self.indexOf(value) === index;
			  });
			}
			
			//Count unique levels
			var Unique_levels= Levels_array.unique()
			
			var counts = {};
			var i = 0
			for (var i = 0; i < Levels_array.length; i++) {
			    counts[Levels_array[i]]= 1 + (counts[Levels_array[i]] || 0);
			}
			
			var Beam_per_floor = []
			var j = 0
			for ( j=0; j<Unique_levels.length; j++){
				Beam_per_floor.push(counts[Unique_levels[j]])
			}
			
			//FluxId
			var FluxId= []
			for (i=0;i<len; i++){
				FluxId.push(Geometry[0]['entities'][i]['id'])
			}
			
			//Generates PROFILE LINE LIST
			var Profiles = []
			var k = 0
			for (k=0 ; k<len ; k++){
				Profiles.push(Geometry[0]['entities'][k])
			}
		    
		    //Assign Type
		    var Type = ["W12X26"] 
		    
		    //Assign Family
		    var Family = ["W Shapes"]
		    
		    var Category = ["Structural Framing"]
		    var StructuralType =["Beam"]
			
		    var beams = [];
		    
		    //Assign Structural & Flipped
		    var Structural = []
		    
		    for (i=0; i<Levels_array.length ;i++ ){
		    	Structural[i]= true
		    }

		    var fluxId, category, family, type, profile, level, structural, structuraltype, flipped, instParamMap, custParamMap;
		    
		    for (var i = 0; i<len; i++) {
		        fluxId = core.GetIndexOrLast(FluxId, i);
		        category = core.GetIndexOrLast(Category, i);
		        family = core.GetIndexOrLast(Family, i);
		        type = core.GetIndexOrLast(Type, i);
		        profile = core.GetIndexOrLast(Profiles, i);
		        level = core.GetIndexOrLast(Levels_array, i);
		        structuraltype = core.GetIndexOrLast(StructuralType, i);
		
		        var beam = revit.createOneLevelFamilyInstance(fluxId, category, family, type, profile, level, structuraltype);
		        beams.push(beam.Out);
		    	}
				
			    return {
			       Beams: beams
		    	};
		}
	
	if (Layer_Beam != 'undefined'){
		var Beams = CreateBeams(Layer_Beam, Level_List).Beams
	}
	
	//CREATE COLUMNS----------------------------------------------------------------------------------------------------------------------

	function CreateColumns(Geometry, Levels) {
		
			//Check and correct end/start points of segment (START POINT ON TOP, END POINT DOWN)
			var i =0
			for (i =0; i<Geometry.length ; i++ ) {
				
				var End =0
				var Start =0
				End = Geometry[0]['entities'][i]['end'][2], 
				Start = Geometry[0]['entities'][i]['start'][2]
			
				if (End>Start){
			
					var START_Pt =0
					var END_Pt = 0
					START_Pt =  Geometry[0]['entities'][i]['start']
					END_Pt =  Geometry[0]['entities'][i]['end']
			
					Geometry[0]['entities'][i]['start'] = END_Pt
					Geometry[0]['entities'][i]['end'] = START_Pt
			
				}
			
			}

			//Get individual wall height
			var Column_heigths = []
			for (i=0; i<Geometry[0]['entities'].length; i++ ){
				Column_heigths.push(Geometry[0]['entities'][i]['end'][2])
			}
			
			//Find level for each wall
			var len= Geometry[0]['entities'].length
			var k=0
			var Levels_array= []
			for (k=0 ; k<len ; k++){
				var l =0
				var difference =[]
				for (l=0 ; l<Levels.length ; l++){
					difference.push(Math.abs(Column_heigths[k]-Levels[l][1]))
				}
				Levels_array.push(Levels[difference.indexOf(Math.min(...difference))][0])
			}
			
			
			//Find topLevel
		    var topLevel = []
		    var i =0
		    for (i=0; i<Levels_array.length ;i++ ){
		    	var Nb = parseInt(Levels_array[i].substr(Levels_array[i].length - 1))+1
		    	var a= "{\"topLevel\": \"Level "+ Nb+ "\"}"
		    	var b= JSON.parse(a)
		    	topLevel.push(b)
		    }
			
			//defines unique function
			Array.prototype.unique = function() {
			  return this.filter(function (value, index, self) { 
			    return self.indexOf(value) === index;
			  });
			}
			
			//Count unique levels
			var Unique_levels= Levels_array.unique()
			
			var counts = {};
			var i = 0
			for (var i = 0; i < Levels_array.length; i++) {
			    counts[Levels_array[i]]= 1 + (counts[Levels_array[i]] || 0);
			}
			
			var Beam_per_floor = []
			var j = 0
			for ( j=0; j<Unique_levels.length; j++){
				Beam_per_floor.push(counts[Unique_levels[j]])
			}
			
			//FluxId
			var FluxId= []
			for (i=0;i<len; i++){
				FluxId.push(Geometry[0]['entities'][i]['id'])
			}
			
			//Generates PROFILE LINE LIST
			var Profiles = []
			var k = 0
			for (k=0 ; k<len ; k++){
				Profiles.push(Geometry[0]['entities'][k])
			}
		    
		    //Assign Type
		    var Type = ["W10X49"] 
		    
		    //Assign Family
		    var Family = ["W Shapes-Column"]
		    
		    var Category = ["Structural Columns"]
		    var StructuralType =["Column"]
			
		    
		    
		    //Assign Structural & Flipped
		    var Structural = []
		    
		    for (i=0; i<Levels_array.length ;i++ ){
		    	Structural[i]= true
		    }
		    console.log(Levels_array)
			var columns = [];
		    var fluxId, category, family, type, profile, level, structural, structuraltype, flipped, instParamMap, custParamMap, geometryParameters;
		    
		    for (var i = 0; i<len; i++) {
		        fluxId = core.GetIndexOrLast(FluxId, i);
		        category = core.GetIndexOrLast(Category, i);
		        family = core.GetIndexOrLast(Family, i);
		        type = core.GetIndexOrLast(Type, i);
		        profile = core.GetIndexOrLast(Profiles, i);
		        level = core.GetIndexOrLast(Levels_array, i);
		        structuraltype = core.GetIndexOrLast(StructuralType, i);
		        geometryParameters = core.GetIndexOrLast(topLevel, i);
		
		        var column = revit.createOneLevelFamilyInstance(fluxId, category, family, type, profile, level, structuraltype);
		        columns.push(column.Out);
		    	}
				
			    return {
			       Columns: columns
		    	};
		}
	
	if (Layer_Column != 'undefined'){
		var Columns = CreateColumns(Layer_Column, Level_List).Columns
	}	
	
	//MERGE ELEMENTS / CREATES REVIT BUILDING----------------------------------------------------------------------------------------------------------------------
	 
	function Merge(Levels, Floors, Walls, Beams, Columns) {
	
		var Building = []
		if (Layer_Level != 'undefined'){
			Building.push(Levels)
		}
		if (Layer_Floor != 'undefined'){
			Building.push(Floors)
		}
		if (Layer_Wall != 'undefined'){
			Building.push(Walls)
		}
		if (Layer_Beam != 'undefined'){
			Building.push(Beams)
		}
		if (Layer_Column != 'undefined'){
			Building.push(Columns)
		}
		return{
			Building : list.Flatten(Building, false)
			}
		}
	return{
	Revit: Merge(Levels, Floors, Walls, Beams, Columns).Building
	} 
 }
	

module.exports = {
    run: run
};
