"use strict";
//#region variables
var canvas = document.getElementsByTagName("canvas")[0];
var ctx = canvas.getContext("2d");
var arcs = [];
var globalRotation = 0;
var globalRotationSmoothed = 0;
var speed = 7.5;
var currentColor = new Color(0, 0, 0);
var currentColorSmoothed = new Color(0, 0, 0);
var nextSpawn = 0;
var RotationAxis = 0;
var GameRunning = true;
var totalArcs = 0;
var score = 0;
var GameOver = document.getElementById("GameOver");
//#endregion
//#region helpers
function GetArcCenter(angle, dist) {
    var x = dist * Math.cos(angle * 0.0174532925);
    var y = dist * Math.sin(angle * 0.0174532925);
    return {
        x,
        y
    };
}

function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

function GenerateArc() {
    var result = {
        rotation: 0,
        size: 0,
        distance: window.innerWidth
    };
    result.rotation = Math.floor(Math.random() * 9) * 45;
    result.size = Math.floor(Math.random() * 5 + 1) * 45;
    return result;
}

function Color(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.toString = function () {
        return "rgb(" + r + "," + g + "," + b + ")";
    }
    this.shade = function (factor) {
        return new Color(Math.floor(this.r * (1 - factor)), Math.floor(this.g * (1 - factor)), Math.floor(this.b * (1 - factor)));
    };
    this.invert = function () {
        return new Color(255 - this.r, 255 - this.g, 255 - this.b);
    }
}
Color.Red = new Color(255, 0, 0);
Color.Green = new Color(0, 255, 0);
Color.Blue = new Color(0, 0, 255);
Color.Black = new Color(0, 0, 0);
Color.White = new Color(255, 255, 255);
Color.Random = function () {
    return new Color(Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255));
}
Color.Lerp = function (c1, c2, amt) {
    return new Color(Math.floor(lerp(c1.r, c2.r, amt)), Math.floor(lerp(c1.g, c2.g, amt)), Math.floor(lerp(c1.b, c2.b, amt)));
}
Number.prototype.between = function (a, b) {
    var min = Math.min(a, b),
        max = Math.max(a, b);

    return this > min && this < max;
};
//#endregion
function Redraw(frames) {
    GameOver.classList.toggle("show", !GameRunning);
    if (!GameRunning) {
        return;
    }
    if (navigator.webkitGetGamepads) {
        var gp = navigator.webkitGetGamepads()[0];
        if (gp != undefined && gp.axes[0] != 0) {
            RotationAxis = gp.axes[0];
        }
    } else {
        var gp = navigator.getGamepads()[0];
        if (gp != undefined && gp.axes[0] != 0) {
            RotationAxis = gp.axes[0];
        }
    }
    if (totalArcs % 25 == 0) {
        currentColor = Color.Random();
        totalArcs++;
        speed *= 1.1;
    }
    currentColorSmoothed = Color.Lerp(currentColorSmoothed, currentColor, 0.2);
    globalRotationSmoothed = lerp(globalRotationSmoothed, globalRotation += RotationAxis * 5, 0.2);
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = currentColorSmoothed.invert().toString();
    ctx.fill();
    if (frames > nextSpawn) {
        arcs.push(GenerateArc());
        totalArcs++;
        nextSpawn = frames + 750;
    }
    arcs.forEach(function (arc) {
        ctx.beginPath();
        ctx.lineWidth = speed;
        ctx.lineCap = "round";
        arc.distance -= speed;
        var rotation = arc.rotation + globalRotationSmoothed;
        ctx.arc(canvas.width / 2, canvas.height / 2, arc.distance, (rotation - arc.size / 2) * 0.0174532925, (rotation + arc.size / 2) * 0.0174532925);
        ctx.strokeStyle = currentColorSmoothed.toString();
        ctx.stroke();
        ctx.closePath();
        if (arc.distance <= speed) {
            score++;
        }
    }, this);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 10, canvas.height / 2 - 1);
    ctx.lineTo(canvas.width / 2 + 10, canvas.height / 2 - 1);
    ctx.lineTo(canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillStyle = currentColorSmoothed.shade(0.5);
    ctx.closePath();
    ctx.fill();
    var color = ctx.getImageData(canvas.width / 2, canvas.height / 2 - 25, 1, 1).data;
    if (color[0] == currentColorSmoothed.r && color[1] == currentColorSmoothed.g && color[2] == currentColorSmoothed.b) {
        GameRunning = false;
        document.getElementById("score").innerText = "score: " + score.toString();
    }
    ctx.arc(canvas.width / 2, canvas.height / 2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "12px sans-serif";
    ctx.fillStyle = currentColorSmoothed.invert().toString();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(score.toString(), canvas.width / 2, canvas.height / 2);
    arcs = arcs.filter(function (elem) {
        return elem.distance > speed
    });
    requestAnimationFrame(Redraw);
}
canvas.focus();
Redraw();
//#region hooks
document.addEventListener("keydown", function (evt) {
    if (GameRunning) {
        if (evt.keyCode == 37) {
            RotationAxis = -1;
        }
        if (evt.keyCode == 39) {
            RotationAxis = 1;
        }
    } else if (!GameRunning) {
        GameRunning = true;
        arcs = [];
        totalArcs = 0;
        speed = 5;
        score = 0;
        Redraw();

    }
});
document.addEventListener("keyup", function (evt) {
    if (evt.keyCode == 37 || evt.keyCode == 39) {
        RotationAxis = 0;
    }
});
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.onresize = function (evt) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};
//#endregion