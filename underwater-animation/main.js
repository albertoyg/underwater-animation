
var canvas;
var gl;

var program;

var near = 1;
var far = 100;


var left = -6.0;
var right = 6.0;
var ytop =6.0;
var bottom = -6.0;


var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0 );
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0 );

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 30.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var dt = 0.0
var prevTime = 0.0;
var resetTimerFlag = true;
var animFlag = false;
var controller;

// These are used to store the current state of objects.
// In animation it is often useful to think of an object as having some DOF
// Then the animation is simply evolving those DOF over time.

////// BACKGROUND ///////

var bigRockPosition = [0,-3.5,0];
var littleRockPosition = [-.75, -3.75, 0];

var oceanFloorPosition = [0,-5,0];

////// FISH //////

var fishRotation = [0, 0, 0];
var fishTailRotation = [0, 0, 0];
var fishPosition = [0,0,0];
var fishSpinAxis = [0,-2,0];

////// DIVER //////

var kneeRotation = [0,0];
var hipRotation = [0,0];
var diverPosition = [0,0,0];

////// SEA WEED /////

var seaWeedWave = [0,0,0,0,0,0,0,0,0];


// Setting the colour which is needed during illumination of a surface
function setColor(c)
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
                                        "shininess"),materialShininess );
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    setColor(materialDiffuse);
	
	// Initialize some shapes, note that the curved ones are procedural which allows you to parameterize how nice they look
	// Those number will correspond to how many sides are used to "estimate" a curved surface. More = smoother
    Cube.init(program);
    Cylinder.init(20,program);
    Cone.init(9,program);																				// changed 20 to 9 to achieve the same amount of sides cone has in example video
    Sphere.init(36,program);

    // Matrix uniforms
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    
    // Lighting Uniforms
    gl.uniform4fv( gl.getUniformLocation(program, 
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
       "shininess"),materialShininess );


    document.getElementById("animToggleButton").onclick = function() {
        if( animFlag ) {
            animFlag = false;
        }
        else {
            animFlag = true;
            resetTimerFlag = true;
            window.requestAnimFrame(render);
        }
        //console.log(animFlag);
		
		controller = new CameraController(canvas);
		controller.onchange = function(xRot,yRot) {
			RX = xRot;
			RY = yRot;
			window.requestAnimFrame(render); };
    };

    render(0);
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix);
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV();   
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCube() {
    setMV();
    Cube.draw();
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawSphere() {
    setMV();
    Sphere.draw();
}

// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCylinder() {
    setMV();
    Cylinder.draw();
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCone() {
    setMV();
    Cone.draw();
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modeling matrix with the result
function gTranslate(x,y,z) {
    modelMatrix = mult(modelMatrix,translate([x,y,z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modeling matrix with the result
function gRotate(theta,x,y,z) {
    modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modeling matrix with the result
function gScale(sx,sy,sz) {
    modelMatrix = mult(modelMatrix,scale(sx,sy,sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop();
}

// pushes the current modelViewMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix);
}


function render(timestamp) {
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    eye = vec3(0,0,10);
    MS = []; // Initialize modeling matrix stack
	
	// initialize the modeling matrix to identity
    modelMatrix = mat4();
    
    // set the camera matrix
    viewMatrix = lookAt(eye, at , up);
   
    // set the projection matrix
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    
    
    // set all the matrices
    setAllMatrices();
    
	if( animFlag )
    {
		// dt is the change in time or delta time from the last frame to this one
		// in animation typically we have some property or degree of freedom we want to evolve over time
		// For example imagine x is the position of a thing.
		// To get the new position of a thing we do something called integration
		// the simpelst form of this looks like:
		// x_new = x + v*dt
		// That is the new position equals the current position + the rate of of change of that position (often a velocity or speed), times the change in time
		// We can do this with angles or positions, the whole x,y,z position or just one dimension. It is up to us!
		dt = (timestamp - prevTime) / 1000.0;
		prevTime = timestamp;
	}
	
	//////////////////// SETTING BACKGROUND (NON-MOVING OBJECTS) ////////////////////// 	



	/// OCEAN FLOOR ///
	gPush(); 																										// MS = [M = []]
		gTranslate(oceanFloorPosition[0],oceanFloorPosition[1],oceanFloorPosition[2]);								// MS = [M = T(0,-5,0)]
		gPush();																									// MS = [M' = M]
		{
			setColor(vec4(0.0,0.0,0.0,0.0));																		// Set colour to black
			gScale(6,1,1)																							// MS = [M' = MS(6,1,1)]
			drawCube();																								// Draw cube size 2x2x2 at origin
		}
		gPop();																										// MS = [M = T(0,-5,0)]
	gPop();																											// MS = []

	/// BIG ROCK ///
		gPush(); 																									// MS = [M = []]
		gTranslate(bigRockPosition[0],bigRockPosition[1],bigRockPosition[2]);										// MS = [M = T(0, -3.5, 0)]
		gPush();																									// MS = [M' = M]
		{
			setColor(vec4(96/255,96/255,96/255,0));																	// Set colour to grey
			gScale(.5,.5,.5)																						// MS = [M' = MS(.5, .5, .5)]
			drawSphere();																							// Draw sphere size radius 1 at origin
		}
		gPop();																										// MS = [M = T(0, -3.5, 0)]
	gPop();																											// MS = []

	/// LITTLE ROCK ///
	gPush();																										// MS = [M = []]
		gTranslate(littleRockPosition[0],littleRockPosition[1],littleRockPosition[2]); 								// MS = [M = T(-.75, -3.75, 0)]
		gPush(); 																									// MS = [M' = M]
		{
			gScale(.25,.25,.25)																						// MS = [M' = MS(.25, .25, .25)]
			drawSphere();																							// Draw sphere size radius 1 at origin
		}
		gPop();																										// MS = [M = T(-.75, -3.75, 0)]
	gPop();																											// MS = []

	//////////////////// FISH ////////////////////// 

	gPush();																										// MS = [M = []]
	{	
	gTranslate(fishSpinAxis[0],fishSpinAxis[1],fishSpinAxis[2]);													// MS = [M = T(0, -2, 0)]

		fishPosition[1] = Math.cos(.001*timestamp);																	// Give up and down motion of fish with cosine 
		gTranslate(fishPosition[0],fishPosition[1],fishPosition[2]);												// We are now spinning around M 

		fishRotation[1] = fishRotation[1] + -30*dt;																	// Changes y value to -30 degrees
		gRotate(fishRotation[1],0,1,0);																				// we are now rotating clockwise around y axis 

		gPush();																									// MS = [M' = M]
		{
			gTranslate(2, 0, 0);																					// MS = [M' = MT(2, 0, 0)]
			gRotate(90, 0,1,0)																						// MS = [M' = MT(2, 0, 0)R(90, 0, 1, 0)]
// BODY //	
			gPush();																								// MS = [M'' = M']
			{
				setColor(vec4(153/255,0,0,0));
				gTranslate(1, 0, 0);																				// MS = [M'' = M'T(1, 0, 0)]
				gRotate(90, 0, 1, 0);   																			// MS = [M'' = M'T(1, 0, 0)R(90, 0, 1, 0)]
				gScale(.5,.5,2);   																					// MS = [M'' = M'T(1, 0, 0)R(90, 0, 1, 0)S(.5,.5,2)]
				drawCone();																							// Draws a cone along z of height 1 centered at the origin and base radius 1.0.
			}
			gPop();																									// MS = [M' = MT(2, 0, 0)R(90, 0, 1, 0)]
// FACE // 
			gPush();																								// MS = [M'' = M']
			{
				setColor(vec4(192/255,192/255,192/255,0));
				gTranslate(-.25, 0, 0);																				// MS = [M'' = M'T(-.25, 0, 0)]
				gRotate(-90, 0, 1, 0);																				// MS = [M'' = M'T(-.25, 0, 0)R(-90, 0, 1, 0)]
				gScale(.5,.5,.5);																					// MS = [M'' = M'T(-.25, 0, 0)R(-90, 0, 1, 0)S(.5,.5,.5)]
				drawCone();																							// Draws a cone along z of height 1 centered at the origin and base radius 1.0.
			}
			gPop();																									// MS = [M' = MT(2, 0, 0)R(90, 0, 1, 0)]
// LEFT EYE // 
			gPush();																								// MS = [M'' = M']
			{

// LEFT PUPIL // 
				gPush()																								// MS = [M''' = M'']
				{
					setColor(vec4(0,0,0,0));
					gTranslate(-.35,.25,.25);																		// MS = [M''' = M''T(-.35, .25, .25)]
					gScale(.05,.05,.05);																			// MS = [M''' = M'T(-.25, .25, .25)S(.05,.05,.05)]
					drawSphere();																					// Draws a sphere centered at the origin of radius 1.0.
				}
				gPop();																								// MS = [M'' = M']	
// LEFT EYEBALL // 
				setColor(vec4(1,1,1,1));			
				gTranslate(-.25,.25,.25);																			// MS = [M'' = M'T(-.25, .25, .25)]
				gScale(.10,.10,.10);																				// MS = [M'' = M'T(-.25, .25, .25)S(.10,.10,.10)]
				drawSphere();																						// Draws a sphere centered at the origin of radius 1.0.

			}
			gPop();																									// MS = [M' = MT(2, 0, 0)R(90, 0, 1, 0)]
// RIGHT EYE // 
			gPush();																								// MS = [M'' = M']
			{

	// RIGHT PUPIL // 
				gPush()																								// MS = [M''' = M'']
				{
					setColor(vec4(0,0,0,0));
					gTranslate(-.35,.25,-.25);																		// MS = [M''' = M''T(-.35, .25, -.25)]
					gScale(.05,.05,.05);																			// MS = [M''' = M''T(-.25, .25, .25)S(.05,.05,.05)]
					drawSphere();																					// Draws a sphere centered at the origin of radius 1.0.
				}
				gPop();																								// MS = [M'' = M']	
	// RIGHT EYEBALL // 
				setColor(vec4(1,1,1,1));			
				gTranslate(-.25,.25,-.25);																			// MS = [M'' = M'T(-.25, .25, -.25)]
				gScale(.10,.10,.10);																				// MS = [M'' = M'T(-.25, .25, .25)S(.10,.10,.10)]
				drawSphere();																						// Draws a sphere centered at the origin of radius 1.0.

			}
			gPop();																									// MS = [M' = MT(2, 0, 0)R(90, 0, 1, 0)]
// TAIL // 
			gPush();																								// MS = [M'' = M']
			{
				gTranslate(2,-.2,0);																				// MS = [M'' = M'T(2,-.2,0)]	

				fishTailRotation[1] = 30*Math.sin(.01*timestamp);													// function for rotating tail
				gRotate(fishTailRotation[1],0,1,0);																	// rotate tail at y axis 

	// BOTTOM FIN // 				
			gPush()																									// MS = [M''' = M'']
			{
				setColor(vec4(153/255,0,0,0));
				gRotate(90, 1, 0, 0);																				// MS = [M''' = M''R(90, 1, 0, 0)]
				gRotate(45,0,1,0)																					// MS = [M''' = M''R(90, 1, 0, 0)R(45,0,1,0)]
				gScale(.15,.15,.5);																					// MS = [M''' = M''R(90, 1, 0, 0))R(45,0,1,0)S(.15,.15,.5)]
				drawCone();																							// Draws a cone along z of height 1 centered at the origin and base radius 1.0.
			}
			gPop();																									// MS = [M'' = M'T(2,-.2,0)]
	// TOP FIN//
			gPush();																								// MS = [M''' = M'']
			{
				setColor(vec4(153/255,0,0,0));
				gTranslate(.2,.6,0);																				// MS = [M'''= M''T(2.2,.4,0)]
				gRotate(-90,1,0,0);																					// MS = [M'''= M''T(2.2,.4,0)R(-90,1,0,0)]
				gRotate(45,0,1,0);																					// MS = [M'''= M''T(2.2,.4,0)R(-90,1,0,0)R(45,0,1,0)]
				gScale(.15,.15,1);																					// MS = M'''= M''T(2.2,.4,0)R(-90,1,0,0)R(45,0,1,0)S(.15,.15,1)]
				drawCone();																							// Draws a cone along z of height 1 centered at the origin and base radius 1.0.
			}
			gPop();																									// MS = [M'' = M'T(2,-.2,0)]
		}
		}
		gPop();																										// MS = [M' = MT(2, 0, 0)R(90, 0, 1, 0)]

	gPop();																											// MS = [M = T(0,-1,0)]
	}
	gPop();																											// MS = []

	//////////////////// DIVER //////////////////////
	
	gPush();																										// MS = [M = []]
	{																										
		gTranslate(3.5, 0, 0);																						// MS = [M = T(3.5,0,0)]
		gRotate(330, 0, 1, 0)																						// MS = [M = T(3.5,0,0)R(330,0,1,0)]
		setColor(vec4(134/255,108/255,203/255,0));
		diverPosition[1] = 0.5*Math.sin(.0005*timestamp);															// Y axis translation for diver
		diverPosition[0] = 0.5*Math.sin(.0005*timestamp);															// X axis translation for diver
		gTranslate(diverPosition[0],diverPosition[1],diverPosition[2])												// Translate the diver on the values above
		// BODY // 
		gPush();																									// MS = [M' = M]
		{
			gScale(.75, 1, .25)																						// MS = [M' = MS(.75, 1, .25)]
			drawCube();
		}
		gPop();																										// MS = [M = T(3.5,0,0)R(330,0,1,0)]
		// HEAD //
		gPush();																									// MS = [M'' = M']
		{
			gTranslate(0,1.35,0);																					// MS = [M'' = M'T(0,1.35,0)]
			gScale(.35,.35,.35);																					// MS = [M'' = M'T(0,1.35,0)S(.35,.35,.35)]
			drawSphere();
		}
		gPop();																										// MS = [M' = M]
		// LEFT LEG
		gPush();																									// MS = [M'' = M']
		{
			gPush();																								// MS = [M''' = M'']
			gTranslate(0,-.75,.05);           	 																	// MS = [M''' = M''T(0,-0.75,0.5)] <-- rotation point for hip	
				hipRotation[0] = 20*Math.cos(.001*timestamp);														// Hip rotation value
				gRotate(hipRotation[0],1,0,0);																		// Rotation of hip
			// THIGH assembly // 
				gPush();																							// MS = [M'''' = M''']
				{
					gTranslate(.45,-1.2,-.5);    																	// MS = [M'''' = M'''T(.45, -1.20, -0.5)] <-- rotation point for knee	
					// chin assembly 
					gPush();																						// MS = [M''''' = M'''']
					{
						// foot // 	
					 	kneeRotation[0] = 26*Math.cos(.001*timestamp);												// Knee rotation value
						gRotate(kneeRotation[0],1,0,0);																// Rotation of the knee
						gRotate(90,1,0,0);																			// MS = [M''''' = M''''R(90,1,0,0)]
						gPush();																					// MS = [M'''''' = M''''']
						{
							gTranslate(0,-1,.2);				 													// MS = [M'''''' = M'''''T(0, -1, 0.2)] <-- foot position
							gScale(.12 , .05, .25);			 														// MS = [M'''''' = M'''''T(0, -1, 0.2)S(0.12,0.05,0.25)]
							drawCube();																				// Draw foot
						}
						gPop();																						// MS = [M''''' = M'''']
						// chin	
						gTranslate(0,-.55,0);								 										// MS = [M''''' = M''''T(0,-0.55,0)] <-- ankle position
						gScale(.12 , .52, .12);																		// MS = [M''''' = M''''T(0,-0.55,0)S(0.12,0.52,0.12)]
						drawCube();																					// Draw chin
					}
					gPop();																							// MS = [M'''' = M''']
				}
				gPop();																								// MS = [M''' = M'']
				gTranslate(.35, -.2, 0);																			// MS = [M''' = M''T(0.32,-0.2,0)]
				gRotate(30,1,0,0);																					// MS = [M''' = M''T(0.32,-0.2,0)R(30,1,0,0)]
				// draw thigh //
				gPush();																							// MS = [M'''' = M''']
				{	
					gTranslate(.10, -.65, 0);																		// MS = [M'''' = M'''T(0.10,-0.65,0)]
					gScale(.15 , .65, .15);																			// MS = [M'''' = M'''T(0.10,-0.65,0)S(0.15,0.65,0.15)]
					drawCube();																						// Draw thigh
				}
				gPop();																								// MS = [M''' = M'']
			gPop();																									// MS = [M'' = M']
		}
		gPop();																										// MS = [M' = M]
		// RIGHT LEG // 
		gPush();																									// MS = [M'' = M']
		{
			gPush();																								// MS = [M''' = M'']
			gTranslate(-.85,-.75,.05);           	 																// MS = [M''' = M''T(-0.85,-0.75,0.5)] <-- rotation point for hip	
				hipRotation[0] = 20*Math.cos(.001*timestamp+10);													// Hip rotation value
				gRotate(hipRotation[0],1,0,0);																		// Rotation of hip
			// THIGH assembly // 
				gPush();																							// MS = [M'''' = M''']
				{
					gTranslate(.45,-1.2,-.5);    																	// MS = [M'''' = M'''T(.45, -1.20, -0.5)] <-- rotation point for knee	
					// chin assembly 
					gPush();																						// MS = [M''''' = M'''']
					{
						// foot // 	
					 	kneeRotation[0] = 26*Math.cos(.001*timestamp+10);											// Knee rotation value
						gRotate(kneeRotation[0],1,0,0);																// Rotation of the knee
						gRotate(90,1,0,0);																			// MS = [M''''' = M''''R(90,1,0,0)]
						gPush();																					// MS = [M'''''' = M''''']
						{
							gTranslate(0,-1,.2);				 													// MS = [M'''''' = M'''''T(0, -1, 0.2)] <-- foot position
							gScale(.12 , .05, .25);			 														// MS = [M'''''' = M'''''T(0, -1, 0.2)S(0.12,0.05,0.25)]
							drawCube();																				// Draw foot
						}
						gPop();																						// MS = [M''''' = M'''']
						// chin	
						gTranslate(0,-.55,0);								 										// MS = [M''''' = M''''T(0,-0.55,0)] <-- ankle position
						gScale(.12 , .52, .12);																		// MS = [M''''' = M''''T(0,-0.55,0)S(0.12,0.52,0.12)]
						drawCube();																					// Draw chin
					}
					gPop();																							// MS = [M'''' = M''']
				}
				gPop();																								// MS = [M''' = M'']
				gTranslate(.35, -.2, 0);																			// MS = [M''' = M''T(0.32,-0.2,0)]
				gRotate(30,1,0,0);																					// MS = [M''' = M''T(0.32,-0.2,0)R(30,1,0,0)]
				// draw thigh //
				gPush();																							// MS = [M'''' = M''']
				{	
					gTranslate(.10, -.65, 0);																		// MS = [M'''' = M'''T(0.10,-0.65,0)]
					gScale(.15 , .65, .15);																			// MS = [M'''' = M'''T(0.10,-0.65,0)S(0.15,0.65,0.15)]
					drawCube();																						// Draw thigh
				}
				gPop();																								// MS = [M''' = M'']
			gPop();																									// MS = [M'' = M']
		}
		gPop();																										// MS = [M' = M]

	}
	gPop();																											// MS = [M = []]

///////////////////////// SEAWEED ////////////////////////////

	// MIDDLE SEAWEED // 
	gPush();
	{	
		setColor(vec4(6/255,110/255,10/255,0));
		gTranslate(0,-2.75,0); // 1st origin contact between 1st leaf and rock

		gPush();
		{	
			gPush();
			{	
				gTranslate(0,.25,0); // origin contact between 1st and 2nd leaf
				seaWeedWave[0] = 20*Math.sin(.001*timestamp);													
				gRotate(seaWeedWave[0],0,0,1);
				gPush();
				{	
					gPush();
					{	
						gTranslate(0,.5,0); // origin contact between 2nd and 3rd leaf
						seaWeedWave[1] = 20*Math.sin(.001*timestamp+2);													
						gRotate(seaWeedWave[1],0,0,1);
						gPush();
						{	
							gPush();
							{	
								gTranslate(0,.5,0); // origin contact between 3nd and 4th leaf
								seaWeedWave[2] = 20*Math.sin(.001*timestamp+3);													
								gRotate(seaWeedWave[2],0,0,1);
								gPush();
								{	
									gPush();
									{	
										gTranslate(0,.5,0); // origin contact between 4th and 5th leaf
										seaWeedWave[3] = 20*Math.sin(.001*timestamp+4);													
										gRotate(seaWeedWave[3],0,0,1);
										gPush();
										{	
											gPush();
											{	
												gTranslate(0,.5,0); // origin contact between 5th and 6th leaf
												seaWeedWave[4] = 20*Math.sin(.001*timestamp+5);													
												gRotate(seaWeedWave[4],0,0,1);
												gPush();
												{	
													gPush();
													{	
														gTranslate(0,.5,0); // origin contact between 6th and 7th leaf
														seaWeedWave[5] = 20*Math.sin(.001*timestamp+6);													
														gRotate(seaWeedWave[5],0,0,1);
														gPush();
														{	
															gPush();
															{	
																gTranslate(0,.5,0); // origin contact between 7th and 8th leaf
																seaWeedWave[6] = 20*Math.sin(.001*timestamp+7);													
																gRotate(seaWeedWave[6],0,0,1);
																gPush();
																{
																	gPush();
																	{	
																		gTranslate(0,.5,0); // origin contact between 8th and 9th leaf
																		seaWeedWave[7] = 20*Math.sin(.001*timestamp+8);													
																		gRotate(seaWeedWave[7],0,0,1);
																		gPush();
																		{	
																			gPush();
																			{	
																				gTranslate(0,.5,0); // origin contact between 9th and 10th leaf
																				seaWeedWave[8] = 15*Math.sin(.001*timestamp+9);													
																				gRotate(seaWeedWave[8],0,0,1);
																				gPush();
																				{	
																					// 10th leaf
																					gTranslate(0,.25,0);	// 10th leaf origin
																					gScale(.12,.25,.12);	// 10th leaf size
																					drawSphere();
																				}
																				gPop();
																			}
																			gPop();
																			// 9th leaf
																			gTranslate(0,.25,0);	// 9th leaf origin
																			gScale(.12,.25,.12);	// 9th leaf size
																			drawSphere();
																		}
																		gPop();
																	}
																	gPop();
																	// 8th leaf
																	gTranslate(0,.25,0);	// 8th leaf origin
																	gScale(.12,.25,.12);	// 8th leaf size
																	drawSphere();
																}
																gPop();
															}
															gPop();
															// 7th leaf
															gTranslate(0,.25,0);	// 7th leaf origin
															gScale(.12,.25,.12);	// 7th leaf size
															drawSphere();
														}
														gPop();
													}
													gPop();
													// 6th leaf
													gTranslate(0,.25,0);	// 6th leaf origin
													gScale(.12,.25,.12);	// 6th leaf size
													drawSphere();
												}
												gPop();
											}
											gPop();
											// 5th leaf
											gTranslate(0,.25,0);	// 5th leaf origin
											gScale(.12,.25,.12);	// 5th leaf size
											drawSphere();
										}
										gPop();
									}
									gPop();
									// 4th leaf
									gTranslate(0,.25,0);   // origin of 4th leaf 
									gScale(.12,.25,.12);	// 4th leaf size
									drawSphere();
								}
								gPop();
							}
							gPop();
							// 3rd leaf
							gTranslate(0,0.25,0);   // origin of 3rd leaf 
							gScale(.12,.25,.12);	// 3rd leaf size
							drawSphere();
						}
						gPop();

					}
					gPop();
				// 2nd leaf
				gTranslate(0,.25,0);	// 2nd leaf origin
				gScale(.12,.25,.12);	// 2nd leaf size
				drawSphere();
				}
				gPop();

			}
			gPop();
			// 1st leaf
			gScale(.12,.25,.12)	// 1st leaf size
			drawSphere();
		}
		gPop();

	}
	gPop();

	// LEFT SEAWEED // 
	gPush();
	{	
		setColor(vec4(6/255,110/255,10/255,0));
		gTranslate(-.5,-3.25,0); // 1st origin contact between 1st leaf and rock

		gPush();
		{	
			gPush();
			{	
				gTranslate(0,.25,0); // origin contact between 1st and 2nd leaf
				seaWeedWave[0] = 20*Math.sin(.001*timestamp);													
				gRotate(seaWeedWave[0],0,0,1);
				gPush();
				{	
					gPush();
					{	
						gTranslate(0,.5,0); // origin contact between 2nd and 3rd leaf
						seaWeedWave[1] = 20*Math.sin(.001*timestamp+2);													
						gRotate(seaWeedWave[1],0,0,1);
						gPush();
						{	
							gPush();
							{	
								gTranslate(0,.5,0); // origin contact between 3nd and 4th leaf
								seaWeedWave[2] = 20*Math.sin(.001*timestamp+3);													
								gRotate(seaWeedWave[2],0,0,1);
								gPush();
								{	
									gPush();
									{	
										gTranslate(0,.5,0); // origin contact between 4th and 5th leaf
										seaWeedWave[3] = 20*Math.sin(.001*timestamp+4);													
										gRotate(seaWeedWave[3],0,0,1);
										gPush();
										{	
											gPush();
											{	
												gTranslate(0,.5,0); // origin contact between 5th and 6th leaf
												seaWeedWave[4] = 20*Math.sin(.001*timestamp+5);													
												gRotate(seaWeedWave[4],0,0,1);
												gPush();
												{	
													gPush();
													{	
														gTranslate(0,.5,0); // origin contact between 6th and 7th leaf
														seaWeedWave[5] = 20*Math.sin(.001*timestamp+6);													
														gRotate(seaWeedWave[5],0,0,1);
														gPush();
														{	
															gPush();
															{	
																gTranslate(0,.5,0); // origin contact between 7th and 8th leaf
																seaWeedWave[6] = 20*Math.sin(.001*timestamp+7);													
																gRotate(seaWeedWave[6],0,0,1);
																gPush();
																{
																	gPush();
																	{	
																		gTranslate(0,.5,0); // origin contact between 8th and 9th leaf
																		seaWeedWave[7] = 20*Math.sin(.001*timestamp+8);													
																		gRotate(seaWeedWave[7],0,0,1);
																		gPush();
																		{	
																			gPush();
																			{	
																				gTranslate(0,.5,0); // origin contact between 9th and 10th leaf
																				seaWeedWave[8] = 15*Math.sin(.001*timestamp+9);													
																				gRotate(seaWeedWave[8],0,0,1);
																				gPush();
																				{	
																					// 10th leaf
																					gTranslate(0,.25,0);	// 10th leaf origin
																					gScale(.12,.25,.12);	// 10th leaf size
																					drawSphere();
																				}
																				gPop();
																			}
																			gPop();
																			// 9th leaf
																			gTranslate(0,.25,0);	// 9th leaf origin
																			gScale(.12,.25,.12);	// 9th leaf size
																			drawSphere();
																		}
																		gPop();
																	}
																	gPop();
																	// 8th leaf
																	gTranslate(0,.25,0);	// 8th leaf origin
																	gScale(.12,.25,.12);	// 8th leaf size
																	drawSphere();
																}
																gPop();
															}
															gPop();
															// 7th leaf
															gTranslate(0,.25,0);	// 7th leaf origin
															gScale(.12,.25,.12);	// 7th leaf size
															drawSphere();
														}
														gPop();
													}
													gPop();
													// 6th leaf
													gTranslate(0,.25,0);	// 6th leaf origin
													gScale(.12,.25,.12);	// 6th leaf size
													drawSphere();
												}
												gPop();
											}
											gPop();
											// 5th leaf
											gTranslate(0,.25,0);	// 5th leaf origin
											gScale(.12,.25,.12);	// 5th leaf size
											drawSphere();
										}
										gPop();
									}
									gPop();
									// 4th leaf
									gTranslate(0,.25,0);   // origin of 4th leaf 
									gScale(.12,.25,.12);	// 4th leaf size
									drawSphere();
								}
								gPop();
							}
							gPop();
							// 3rd leaf
							gTranslate(0,0.25,0);   // origin of 3rd leaf 
							gScale(.12,.25,.12);	// 3rd leaf size
							drawSphere();
						}
						gPop();

					}
					gPop();
				// 2nd leaf
				gTranslate(0,.25,0);	// 2nd leaf origin
				gScale(.12,.25,.12);	// 2nd leaf size
				drawSphere();
				}
				gPop();

			}
			gPop();
			// 1st leaf
			gScale(.12,.25,.12)	// 1st leaf size
			drawSphere();
		}
		gPop();

	}
	gPop();

	// RIGHT SEAWEED // 
	gPush();
	{	
		setColor(vec4(6/255,110/255,10/255,0));
		gTranslate(.5,-3.25,0); // 1st origin contact between 1st leaf and rock

		gPush();
		{	
			gPush();
			{	
				gTranslate(0,.25,0); // origin contact between 1st and 2nd leaf
				seaWeedWave[0] = 20*Math.sin(.001*timestamp);													
				gRotate(seaWeedWave[0],0,0,1);
				gPush();
				{	
					gPush();
					{	
						gTranslate(0,.5,0); // origin contact between 2nd and 3rd leaf
						seaWeedWave[1] = 20*Math.sin(.001*timestamp+2);													
						gRotate(seaWeedWave[1],0,0,1);
						gPush();
						{	
							gPush();
							{	
								gTranslate(0,.5,0); // origin contact between 3nd and 4th leaf
								seaWeedWave[2] = 20*Math.sin(.001*timestamp+3);													
								gRotate(seaWeedWave[2],0,0,1);
								gPush();
								{	
									gPush();
									{	
										gTranslate(0,.5,0); // origin contact between 4th and 5th leaf
										seaWeedWave[3] = 20*Math.sin(.001*timestamp+4);													
										gRotate(seaWeedWave[3],0,0,1);
										gPush();
										{	
											gPush();
											{	
												gTranslate(0,.5,0); // origin contact between 5th and 6th leaf
												seaWeedWave[4] = 20*Math.sin(.001*timestamp+5);													
												gRotate(seaWeedWave[4],0,0,1);
												gPush();
												{	
													gPush();
													{	
														gTranslate(0,.5,0); // origin contact between 6th and 7th leaf
														seaWeedWave[5] = 20*Math.sin(.001*timestamp+6);													
														gRotate(seaWeedWave[5],0,0,1);
														gPush();
														{	
															gPush();
															{	
																gTranslate(0,.5,0); // origin contact between 7th and 8th leaf
																seaWeedWave[6] = 20*Math.sin(.001*timestamp+7);													
																gRotate(seaWeedWave[6],0,0,1);
																gPush();
																{
																	gPush();
																	{	
																		gTranslate(0,.5,0); // origin contact between 8th and 9th leaf
																		seaWeedWave[7] = 20*Math.sin(.001*timestamp+8);													
																		gRotate(seaWeedWave[7],0,0,1);
																		gPush();
																		{	
																			gPush();
																			{	
																				gTranslate(0,.5,0); // origin contact between 9th and 10th leaf
																				seaWeedWave[8] = 15*Math.sin(.001*timestamp+9);													
																				gRotate(seaWeedWave[8],0,0,1);
																				gPush();
																				{	
																					// 10th leaf
																					gTranslate(0,.25,0);	// 10th leaf origin
																					gScale(.12,.25,.12);	// 10th leaf size
																					drawSphere();
																				}
																				gPop();
																			}
																			gPop();
																			// 9th leaf
																			gTranslate(0,.25,0);	// 9th leaf origin
																			gScale(.12,.25,.12);	// 9th leaf size
																			drawSphere();
																		}
																		gPop();
																	}
																	gPop();
																	// 8th leaf
																	gTranslate(0,.25,0);	// 8th leaf origin
																	gScale(.12,.25,.12);	// 8th leaf size
																	drawSphere();
																}
																gPop();
															}
															gPop();
															// 7th leaf
															gTranslate(0,.25,0);	// 7th leaf origin
															gScale(.12,.25,.12);	// 7th leaf size
															drawSphere();
														}
														gPop();
													}
													gPop();
													// 6th leaf
													gTranslate(0,.25,0);	// 6th leaf origin
													gScale(.12,.25,.12);	// 6th leaf size
													drawSphere();
												}
												gPop();
											}
											gPop();
											// 5th leaf
											gTranslate(0,.25,0);	// 5th leaf origin
											gScale(.12,.25,.12);	// 5th leaf size
											drawSphere();
										}
										gPop();
									}
									gPop();
									// 4th leaf
									gTranslate(0,.25,0);   // origin of 4th leaf 
									gScale(.12,.25,.12);	// 4th leaf size
									drawSphere();
								}
								gPop();
							}
							gPop();
							// 3rd leaf
							gTranslate(0,0.25,0);   // origin of 3rd leaf 
							gScale(.12,.25,.12);	// 3rd leaf size
							drawSphere();
						}
						gPop();

					}
					gPop();
				// 2nd leaf
				gTranslate(0,.25,0);	// 2nd leaf origin
				gScale(.12,.25,.12);	// 2nd leaf size
				drawSphere();
				}
				gPop();

			}
			gPop();
			// 1st leaf
			gScale(.12,.25,.12)	// 1st leaf size
			drawSphere();
		}
		gPop();

	}
	gPop();

    if( animFlag )
        window.requestAnimFrame(render);
}

// A simple camera controller which uses an HTML element as the event
// source for constructing a view matrix. Assign an "onchange"
// function to the controller as follows to receive the updated X and
// Y angles for the camera:
//
//   var controller = new CameraController(canvas);
//   controller.onchange = function(xRot, yRot) { ... };
//
// The view matrix is computed elsewhere.
function CameraController(element) {
	var controller = this;
	this.onchange = null;
	this.xRot = 0;
	this.yRot = 0;
	this.scaleFactor = 3.0;
	this.dragging = false;
	this.curX = 0;
	this.curY = 0;
	
	// Assign a mouse down handler to the HTML element.
	element.onmousedown = function(ev) {
		controller.dragging = true;
		controller.curX = ev.clientX;
		controller.curY = ev.clientY;
	};
	
	// Assign a mouse up handler to the HTML element.
	element.onmouseup = function(ev) {
		controller.dragging = false;
	};
	
	// Assign a mouse move handler to the HTML element.
	element.onmousemove = function(ev) {
		if (controller.dragging) {
			// Determine how far we have moved since the last mouse move
			// event.
			var curX = ev.clientX;
			var curY = ev.clientY;
			var deltaX = (controller.curX - curX) / controller.scaleFactor;
			var deltaY = (controller.curY - curY) / controller.scaleFactor;
			controller.curX = curX;
			controller.curY = curY;
			// Update the X and Y rotation angles based on the mouse motion.
			controller.yRot = (controller.yRot + deltaX) % 360;
			controller.xRot = (controller.xRot + deltaY);
			// Clamp the X rotation to prevent the camera from going upside
			// down.
			if (controller.xRot < -90) {
				controller.xRot = -90;
			} else if (controller.xRot > 90) {
				controller.xRot = 90;
			}
			// Send the onchange event to any listener.
			if (controller.onchange != null) {
				controller.onchange(controller.xRot, controller.yRot);
			}
		}
	};
}
