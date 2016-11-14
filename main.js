
var gl;
var squareVerticesBuffer;
var squareVerticesColorBuffer;
var mvMatrix;
var shaderProgram;
var vertexPositionAttribute;
var vertexColorAttribute;
var perspectiveMatrix;
var colors = function() {
    var counter = 16;
    var arr = [];
    while(counter) {
        counter--;
        arr.push(Math.random()*1.5);
    }
    return arr;
}();

var rollFlags = new Array(16);
var stop = false;
var zoom = -3.5;
var horizAspect = 480.0 / 640.0;

function start() {

    var gl;
    var canvas = document.getElementById('gl');

    gl = initWebGL(canvas);

    if (gl) {

        render();

        window.addEventListener('resize', function () {
            render();
        });


    }

    setInterval(function () {
            if (!stop) {
                render();
                colors = matrixRoller(colors);
                drawScene();
            }
        }
        , 15);


    function render() {
        resizeCanvas(canvas, gl);
        resetGL(gl);
        initShaders();
        initBuffers();
        drawScene();
    }
}


function initBuffers() {
    squareVerticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);

    var vertices = [
        2.0, 2.0, 0.0,
        -2.0, 2.0, 0.0,
        2.0, -2.0, 0.0,
        -2.0, -2.0, 0.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);


    squareVerticesColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

}

function initWebGL(canvas) {

    gl = null;

    try {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    } catch (e) {
    }

    if (!gl) {
        alert('ERORR!');
        gl = null;
    }

    return gl;
}

function resetGL(gl) {
    gl.clearColor(0.3, 0.2, 0.4, 0.7);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function resizeCanvas(canvas, gl) {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

}

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);


    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program.");
    }

    gl.useProgram(shaderProgram);

    vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);

    vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(vertexColorAttribute);
}

function getShader(gl, id) {
    var shaderScript, theSource, currentChild, shader;

    shaderScript = document.getElementById(id);

    if (!shaderScript) {
        return null;
    }

    theSource = "";
    currentChild = shaderScript.firstChild;

    while (currentChild) {
        if (currentChild.nodeType == currentChild.TEXT_NODE) {
            theSource += currentChild.textContent;
        }

        currentChild = currentChild.nextSibling;
    }

    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        // неизвестный тип шейдера
        return null;
    }

    gl.shaderSource(shader, theSource);

    // скомпилировать шейдерную программу
    gl.compileShader(shader);

    // Проверить успешное завершение компиляции
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function drawScene() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    perspectiveMatrix = makePerspective(45, 640.0 / 480.0, 0.1, 100.0);

    loadIdentity();
    mvTranslate([-0.0, 0.0, zoom]);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    // Set the colors attribute for the vertices.

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
    gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

    // Draw the square.

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

}

//Helper utils
function matrixRoller(colors) {

    for (i = 0, l = colors.length; i < l; i++) {
        if(rollFlags[i] == null) {rollFlags[i] = "V";}

        if (rollFlags[i] == "V") {
            colors[i] += 0.02;
            colors[i] = Math.round(colors[i] * 1000) / 1000;
        }
        else if (rollFlags[i] == "^") {
            colors[i] -= 0.01;
            colors[i] = Math.round(colors[i] * 1000) / 1000;
        }

        if (colors[i] > 1.2) {
            rollFlags[i] = "^";
        }

        if (colors[i] < 0.2) {
            rollFlags[i] = "V";
        }

        if(Math.random() > 0.97 && rollFlags[i-1] == rollFlags[i] && rollFlags[i] == rollFlags[i+1]) {
            rollFlags[i] == "V" ? rollFlags[i] = "^" : rollFlags[i] == "^" ? rollFlags[i] = "V" : null;
            colors[i]= colors[i] - 0.03;
        }


    }




    console.log(colors, rollFlags);
    return colors;
}

function loadIdentity() {
    mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
    mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
    multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
    var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

    var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}


document.onclick = function (e) {
    stop = true;
}

document.addEventListener("keypress", function(e) {


    if(e.keyCode == "32" || e.keyCode == "13") {
        toggleFullScreen();
    }
});

function toggleFullScreen() {
    document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement ? document.cancelFullScreen ? document.cancelFullScreen() : document.mozCancelFullScreen ? document.mozCancelFullScreen() : document.webkitCancelFullScreen && document.webkitCancelFullScreen() : document.documentElement.requestFullscreen ? document.documentElement.requestFullscreen() : document.documentElement.mozRequestFullScreen ? document.documentElement.mozRequestFullScreen() : document.documentElement.webkitRequestFullscreen && document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)
}