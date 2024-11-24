var gl, program;
var myZeta = 0.0, myPhi = Math.PI / 2.0, radius = 5.0, fovy = 1.4;
var projectionMatrix; 
var renderWireframe = false; // Variable para alternar modos
var edificioBuffers = null; // Buffers para el modelo JSON de edificio
var arbolBuffers = null; // Buffers para el modelo JSON de arbol
var planeBuffers = null; // Buffers para el plano
var roadBuffers = null; // Buffers para la carretera
var buildingBuffers = null; // Buffers para los edificios
var lineBuffers = null; // Buffers para las marcas viales

// Variables coche
var carBuffers = null; 
var carPosition = [-50.0, 0.1, 0.0]; 
var carSpeed = 1.0; 
var isCarStopped = false; 

// Variables de cámara
var cameraPosition = [0.0, 1.8, 10.0];
var cameraFront = [0.0, 0.0, -1.0];
var cameraUp = [0.0, 1.0, 0.0];
var yaw = -90.0;
var pitch = 0.0;
var moveSpeed = 0.2;
var sensitivity = 0.1;

function getWebGLContext() {
    // Obtiene el contexto WebGL2 del canvas para habilitar las operaciones de renderizado.
    // Si no se puede obtener el contexto, retorna null.
    var canvas = document.getElementById("glCanvas");
    try {
        return canvas.getContext("webgl2", { antialias: true });
    } catch (e) {}
    return null;
}

function initShaders() {
    // Define y compila los shaders del programa (vertex y fragment shaders).
    // Los shaders transforman las posiciones de los vértices y calculan los colores de los fragmentos.

    const vertexShaderSource = `#version 300 es
    in vec3 aPosition;
    uniform mat4 uModelMatrix, uViewMatrix, uProjectionMatrix;
    void main() {
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
    }`;

    const fragmentShaderSource = `#version 300 es
    precision highp float;
    uniform vec4 uColor;
    out vec4 fragColor;
    void main() {
        fragColor = uColor;
    }`;

    // Crea y enlaza los shaders al programa.
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    // Activa el programa de shaders para usarlo en el renderizado.
    gl.useProgram(program);

    program.vertexPositionAttribute = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(program.vertexPositionAttribute);
    program.modelMatrixIndex = gl.getUniformLocation(program, "uModelMatrix");
    program.viewMatrixIndex = gl.getUniformLocation(program, "uViewMatrix");
    program.projectionMatrixIndex = gl.getUniformLocation(program, "uProjectionMatrix");
    program.colorIndex = gl.getUniformLocation(program, "uColor");
}


function initBuffers() {
    // Inicializa los buffers para almacenar los vértices y los índices de un plano.
    const vertices = new Float32Array([
        -50.0, 0.0, -30.0,
         50.0, 0.0, -30.0,
         50.0, 0.0,  30.0,
        -50.0, 0.0,  30.0
    ]);

    const indices = new Uint16Array([
        0, 1, 2,
        0, 2, 3
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(program.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    return { vertexBuffer, indexBuffer, indicesCount: indices.length };
}

function initRoadBuffers() {
    // Inicializa los buffers para definir la geometría de la carretera.
    const vertices = new Float32Array([
        -50.0, 0.01, -5.0,
         50.0, 0.01, -5.0,
         50.0, 0.01,  5.0,
        -50.0, 0.01,  5.0
    ]);

    const indices = new Uint16Array([
        0, 1, 2,
        0, 2, 3
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(program.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    return { vertexBuffer, indexBuffer, indicesCount: indices.length };
}

function initBuildingBuffers() {
    //Inicializa los buffers necesarios para representar un edificio.
    const vertices = new Float32Array([
        -1.0, 0.0, -1.0,
         1.0, 0.0, -1.0,
         1.0, 0.0,  1.0,
        -1.0, 0.0,  1.0,
        -1.0, 5.0, -1.0,
         1.0, 5.0, -1.0,
         1.0, 5.0,  1.0,
        -1.0, 5.0,  1.0
    ]);

    const indices = new Uint16Array([
        0, 1, 2, 0, 2, 3,
        0, 4, 5, 0, 5, 1,
        1, 5, 6, 1, 6, 2,
        2, 6, 7, 2, 7, 3,
        3, 7, 4, 3, 4, 0,
        4, 5, 6, 4, 6, 7
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(program.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    return { vertexBuffer, indexBuffer, indicesCount: indices.length };
}

function initLineBuffers() {
    // Configura los buffers necesarios para representar líneas discontinuas (marcas viales)
    const lineVertices = [];
    const segmentLength = 2.0;
    const gapLength = 1.0; 
    let startX = -50.0; 

    // Crear segmentos de líneas discontinuas
    while (startX < 50.0) {
        lineVertices.push(startX, 0.02, 0.0); 
        lineVertices.push(startX + segmentLength, 0.02, 0.0); 
        startX += segmentLength + gapLength; 
    }

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.STATIC_DRAW);

    return { vertexBuffer, vertexCount: lineVertices.length / 3 };
}

function initCarBuffers() {
    // Configura los buffers necesarios para representar un "coche".
    const vertices = new Float32Array([
        -1.0, 0.0, -0.5,
         1.0, 0.0, -0.5,
         1.0, 0.0,  0.5,
        -1.0, 0.0,  0.5,
        -1.0, 1.0, -0.5,
         1.0, 1.0, -0.5,
         1.0, 1.0,  0.5,
        -1.0, 1.0,  0.5,
    ]);

    const indices = new Uint16Array([
        0, 1, 2, 0, 2, 3,
        0, 4, 5, 0, 5, 1,
        1, 5, 6, 1, 6, 2,
        2, 6, 7, 2, 7, 3,
        3, 7, 4, 3, 4, 0,
        4, 5, 6, 4, 6, 7,
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(program.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    return { vertexBuffer, indexBuffer, indicesCount: indices.length };
}

function initWheelBuffers() {
    const vertices = new Float32Array([
        -0.2, 0.0, -0.1, 
         0.2, 0.0, -0.1, 
         0.2, 0.0,  0.1, 
        -0.2, 0.0,  0.1, 
        -0.2, 0.4, -0.1, 
         0.2, 0.4, -0.1, 
         0.2, 0.4,  0.1, 
        -0.2, 0.4,  0.1  
    ]);

    const indices = new Uint16Array([
        0, 1, 2, 0, 2, 3, 
        0, 4, 5, 0, 5, 1, 
        1, 5, 6, 1, 6, 2, 
        2, 6, 7, 2, 7, 3, 
        3, 7, 4, 3, 4, 0, 
        4, 5, 6, 4, 6, 7  
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return { vertexBuffer, indexBuffer, indicesCount: indices.length };
}

async function loadModel(url) {
      // Carga un modelo 3D desde un archivo JSON y configura los buffers necesarios.
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error al cargar el archivo JSON: ${response.statusText}`);
    }
    const data = await response.json();

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertices), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices), gl.STATIC_DRAW);

    return {
        vertexBuffer,
        indexBuffer,
        indicesCount: data.indices.length
    };
}

function initRendering() {
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);
}

function setProjection() {
    const projectionMatrix = mat4.create(); // Crear una nueva matriz de proyección
    mat4.perspective(
        projectionMatrix,
        Math.PI / 4, 
        gl.canvas.width / gl.canvas.height,
        0.1, 
        100.0 
    );
    gl.uniformMatrix4fv(program.projectionMatrixIndex, false, projectionMatrix);
}


function getCameraMatrix() {
    const target = [
        cameraPosition[0] + cameraFront[0],
        cameraPosition[1] + cameraFront[1],
        cameraPosition[2] + cameraFront[2]
    ];
    return mat4.lookAt(mat4.create(), cameraPosition, target, cameraUp);
}

function drawBuffers(buffers, color, translation = [0, 0, 0]) {
    // Renderiza un conjunto de buffers.
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
    gl.vertexAttribPointer(program.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);

    
    if (renderWireframe) {
        color = [1.0, 1.0, 1.0, 1.0]; 
    }

    gl.uniform4fv(program.colorIndex, color);

    const modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, translation);
    gl.uniformMatrix4fv(program.modelMatrixIndex, false, modelMatrix);

    if (renderWireframe) {
        for (let i = 0; i < buffers.indicesCount; i += 3) {
            gl.drawElements(gl.LINE_LOOP, 3, gl.UNSIGNED_SHORT, i * 2);
        }
    } else {
        gl.drawElements(gl.TRIANGLES, buffers.indicesCount, gl.UNSIGNED_SHORT, 0);
    }
}


function drawLines(buffers, color) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
    gl.vertexAttribPointer(program.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.uniform4fv(program.colorIndex, color);

    const modelMatrix = mat4.create();
    gl.uniformMatrix4fv(program.modelMatrixIndex, false, modelMatrix);

    gl.drawArrays(gl.LINES, 0, buffers.vertexCount);
}

function animateCar() {
    if (!isCarStopped) {
        carPosition[0] += carSpeed * 0.1; // Actualizar posición solo si no está detenido
        if (carPosition[0] > 50.0) {
            carPosition[0] = -50.0; // Reiniciar al lado izquierdo
        }
    }

    drawScene(); 
    requestAnimationFrame(animateCar); // Continuar la animación
}


function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Configura la matriz de proyección y vista.
    setProjection();
    const viewMatrix = getCameraMatrix();
    gl.uniformMatrix4fv(program.viewMatrixIndex, false, viewMatrix);

    drawBuffers(planeBuffers, [0.6, 0.8, 0.4, 1.0]);
    drawBuffers(roadBuffers, [0.3, 0.3, 0.3, 1.0]);
    drawLines(lineBuffers, [1.0, 1.0, 1.0, 1.0]); 


    // Dibuja edificios a ambos lados de la carretera con geometria simple
    const offsets = [-20.0, -10.0, 10.0, 20.0];
    for (const offset of offsets) {
        drawBuffers(buildingBuffers, [0.7, 0.7, 0.7, 1.0], [offset, 0.0, -15.0]);
        drawBuffers(buildingBuffers, [0.7, 0.7, 0.7, 1.0], [offset, 0.0, 15.0]);
    }

    // Dibujar el coche y las ruedas
    if (carBuffers) {
        drawBuffers(carBuffers, [1.0, 0.0, 0.0, 1.0], carPosition);

        const wheelOffsets = [
            [-0.8, 0.0, -0.6], 
            [ 0.8, 0.0, -0.6], 
            [-0.8, 0.0,  0.6], 
            [ 0.8, 0.0,  0.6] 
        ];

        for (const offset of wheelOffsets) {
            const wheelPosition = [
                carPosition[0] + offset[0],
                carPosition[1] + offset[1],
                carPosition[2] + offset[2]
            ];
            drawBuffers(wheelBuffers, [0.0, 0.0, 0.0, 1.0], wheelPosition);
        }

    }

    // Dibuja el modelo árbol en las posiciones indicadas.
    if (arbolBuffers) {
        const treePositions = [
            [-15.0, 0.0, 10.0], [-10.0, 0.0, -12.0],
            [12.0, 0.0, 12.0],[-5.0, 0.0, -10.0],
            [8.0, 0.0, 8.0],[15.0, 0.0, -10.0],
            [12.0, 0.0, -12.0],[-20.0, 0.0, 12.0],
            [-20.0, 0.0, -12.0],[-25.0, 0.0, -15.0], 
            [-5.0, 0.0, 8.0], [5.0, 0.0, -8.0],
            [20.0, 0.0, -12.0], [2.0, 0.0, -15.0], [20.0, 0.0, 12.0], 
            [20.0, 0.0, 19.0], [2.0, 0.0, 10.0]
        ];

        for (const position of treePositions) {
            drawBuffers(arbolBuffers, [0.2, 0.6, 0.2, 1.0], position);
        }
    }

     // Dibuja el modelo edificio en varias posiciones
    if (edificioBuffers) {
        drawBuffers(edificioBuffers, [0.5, 0.5, 0.5, 1.0], [-15.0, 0.0, 10.0]); 
        drawBuffers(edificioBuffers, [0.5, 0.5, 0.5, 1.0], [-1.0, 0.0, -12.0]); 
        drawBuffers(edificioBuffers, [0.5, 0.5, 0.5, 1.0], [12.0, 0.0, 12.0]); 
        drawBuffers(edificioBuffers, [0.5, 0.5, 0.5, 1.0], [-12.0, 0.0, -12.0]);
        drawBuffers(edificioBuffers, [0.5, 0.5, 0.5, 1.0], [1.0, 0.0, 12.0]);
        drawBuffers(edificioBuffers, [0.5, 0.5, 0.5, 1.0], [-5.0, 0.0, -17.0]);
        drawBuffers(edificioBuffers, [0.5, 0.5, 0.5, 1.0], [5.0, 0.0, -17.0]);
        drawBuffers(edificioBuffers, [0.5, 0.5, 0.5, 1.0], [15.0, 0.0, -12.0]);
    }
}

function initHandlers() {
    const canvas = document.getElementById("glCanvas");

    // Maneja las teclas para mover la cámara, controlar el cambio de shaders y detener el vehiculo
    document.addEventListener("keydown", (event) => {
        const right = vec3.cross(vec3.create(), [cameraFront[0], 0.0, cameraFront[2]], cameraUp);
        vec3.normalize(right, right);

        if (event.key === "w") {
            vec3.scaleAndAdd(cameraPosition, cameraPosition, [cameraFront[0], 0.0, cameraFront[2]], moveSpeed);
        }
        if (event.key === "s") {
            vec3.scaleAndAdd(cameraPosition, cameraPosition, [cameraFront[0], 0.0, cameraFront[2]], -moveSpeed);
        }
        if (event.key === "a") {
            vec3.scaleAndAdd(cameraPosition, cameraPosition, right, -moveSpeed);
        }
        if (event.key === "d") {
            vec3.scaleAndAdd(cameraPosition, cameraPosition, right, moveSpeed);
        }
        if (event.code === "Space") {
            isCarStopped = true; 
        }
        if (event.key === "1") {
            renderWireframe = false;
            drawScene();
        } else if (event.key === "2") {
            renderWireframe = true;
            drawScene();
        }

        drawScene();
    });

    document.addEventListener("keyup", (event) => {
        if (event.code === "Space") {
            isCarStopped = false; 
        }
    });
    

    canvas.addEventListener("click", () => {
        canvas.requestPointerLock();
    });

    document.addEventListener("mousemove", (event) => {
        if (document.pointerLockElement !== canvas) return;

        const deltaX = event.movementX * sensitivity;
        const deltaY = event.movementY * sensitivity;

        yaw += deltaX;
        pitch -= deltaY;

        pitch = Math.max(-45.0, Math.min(45.0, pitch));
        updateCameraVectors();
        drawScene();
    });
    
}

function updateCameraVectors() {
     // Calcula la dirección de la cámara en función de los ángulos yaw y pitch.
    const x = Math.cos(glMatrix.toRadian(yaw)) * Math.cos(glMatrix.toRadian(pitch));
    const y = Math.sin(glMatrix.toRadian(pitch));
    const z = Math.sin(glMatrix.toRadian(yaw)) * Math.cos(glMatrix.toRadian(pitch));
    cameraFront = vec3.fromValues(x, y, z);
    vec3.normalize(cameraFront, cameraFront);
}

async function initWebGL() {
    //Obtiene el contexto WebGL 2.0 del canvas
    gl = getWebGLContext();
    if (!gl) {
        alert("WebGL 2.0 no está disponible");
        return;
    }

    projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100.0);

    // Inicializa los shaders y los buffers necesarios
    initShaders();
    planeBuffers = initBuffers();
    roadBuffers = initRoadBuffers();
    buildingBuffers = initBuildingBuffers();
    lineBuffers = initLineBuffers();
    carBuffers = initCarBuffers(); 
    wheelBuffers = initWheelBuffers(); 

    initRendering();
    initHandlers();

    // Carga modelos adicionales
    arbolBuffers = await loadModel("arbol.json");
    edificioBuffers = await loadModel("edificio.json");

    drawScene();
    animateCar(); 
}

initWebGL();
