// Script with functions to create trial timeline and stimulus:

/*
    Most of these function are a implementation from opensesame's function to calculate positions:
    https://github.com/open-cogsci/OpenSesame/blob/58dc9ffee3e9e19325e3302d6ae9d12764d5a8d7/libopensesame/python_workspace_api.py

    Functions to draw_display:
*/

const radians = (degrees) => {return degrees * (Math.PI/180)}
const xy_from_polar = (phi, rho) => {

    // This function assume that the pole is at the coordenates [0, 0]
    if (typeof(rho) === "undefined") return;

    const phi0 = radians(phi);
    const x = rho * Math.cos(phi0);
    const y = rho * Math.sin(phi0);

    return [x, y];

}

const xy_circle = (rho, n = 8, phi0 = 0) => {
    const arr = [];
    let phi = phi0;

    for (let i = 0; i < n; i++) {
        arr.push(xy_from_polar(phi, rho))
        phi += 360/n
    }

    return arr;
}

const draw_line = (length, width, angle, x, y) => {
    return {
        obj_type: 'line',
        line_length: length,
        line_width: width,
        angle: angle,
        line_color: 'white', // You can use the HTML color name instead of the HEX color.,
        origin_center: true,
        startX: x,
        startY: y,
    };
}
const draw_cross = (radius, line_w) => {
    return [{
        obj_type: 'line',
        line_length: radius,
        line_width: line_w,
        angle: 0,
        line_color: 'white', 
        origin_center: true,
    }, {
        obj_type: 'line',
        line_length: radius,
        line_width: line_w,
        angle: 90,
        line_color: 'white', 
        origin_center: true,
    }];

}

const draw_circle = (radius, line_w, color, x, y) => {
    return {
        obj_type: 'circle',
        radius: radius,
        line_width: line_w,
        line_color: color, // You can use the HTML color name instead of the HEX color.,
        origin_center: true,
        startX: x,
        startY: y,
    };
}

const draw_diamond = (length, line_w, color, x, y) => {
    return {
        obj_type: 'manual',
        startX: x,
        startY: y - length/2,
        origin_center: true,
        drawFunc: (stimulus, canvas, context, elapsedTime, sumOfStep, length0 = length, width = line_w, color0 = color) => {
            context.beginPath();
        
            [x, y] = [stimulus.currentX, stimulus.currentY]
            context.moveTo(x, y);
                    
                    // top left edge
            context.lineTo(x - length0/2,  y + length0/2);
                    
                    // bottom left edge
            context.lineTo(x, y + length0);
                    
                    // bottom right edge
            context.lineTo(x + length0/2, y + length0/2);
                    
                    // closing the path automatically creates
                    // the top right edge
            context.closePath();
            context.linewidth = line_w;
            context.strokeStyle = color0;
            context.stroke();
                    
        },
    }
};

const create = (shape, radius, width, color, x, y, orientation) => {
    if (shape == "diamond") {
        return [draw_diamond(radius*2, width, color, x, y), draw_line(radius, width, orientation, x, y)];
    } else {
        console.log(shape, radius, width, color, x, y, orientation)
        return [draw_circle(radius, width, color, x, y), draw_line(radius, width, orientation, x, y)];
    }
}

const draw_display = (radius, width, rho, shape, color, targetPos, singletonPos) => {

    const arr = [];

    arr.push(...draw_cross(radius, width));

    const coordinates = xy_circle(rho); 
    
    let stimuli, x, y, orientation, tSC, singSC;

    for (let i = 0; i < 8; i++) {

        [x, y] = coordinates[i];

        orientation = shuffle([0, 90])[0]
        
        if (i === targetPos) {
            //Change this to make dimension variable 
            tSC = (shape === "diamond") ? "circle": "diamond";
            stimuli = create(tSC, radius, width, color, x, y, orientation);

        } else if (i === singletonPos) {
            //Change this to make dimension variable 
            singSC = (color === "red") ? "green": "red";
            stimuli = create(shape, radius, width, singSC, x, y, orientation);
        } else {
    
            stimuli = create(shape, radius, width, color, x, y, orientation);
    
        }

        arr.push(...stimuli);
    }

    return arr;
}

// Functions to create trials:

const shuffle = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

const random = (min, max, no) => {
    no = (typeof no !== 'undefined') ?  no : -1;
    let rnum = Math.floor(Math.random() * (max - min)) + min;
    while (rnum == no) {
        rnum = Math.floor(Math.random() * (max - min)) + min;
    }
    return rnum;
}

const zeros  = (m,n) => {
    return Array.from({
        length: m
    }, 
    () => new Array(n).fill(0));
}

const trials = 720;
let distractorAbsent = zeros(Math.floor(trials*(1-.66)+1), 8); //245 trials
let distractorHigh = zeros(Math.floor(trials*(.66*.65)+1), 8); // 309 trials
let distractorLow = zeros(Math.floor(trials*(.66*.35)), 8); // 166 trials

const HPDL = random(0, 8);

// Filling distractor absent with targets (2s = target):
for (let i = 0; i < distractorAbsent.length; i++){
    distractorAbsent[i][random(0, 8)] = 2;
}

// Filling distractactor HPDL (1s = singleton; 2s = target):
for (let i = 0; i < distractorHigh.length; i++){
    distractorHigh[i][HPDL] = 1;
    distractorHigh[i][random(0, 8, [HPDL])] = 2;
}

// Filling distractor low:
 for (let i = 0; i < distractorLow.length; i++){
    distractorLow[i][random(0, 8, [HPDL])] = 2;
    distractorLow[i][random(0, 8, [HPDL, distractorLow[i].indexOf(2)])] = 1;
}

// Combining the arrays:
let conditionLog = [];
conditionLog = conditionLog.concat(
    distractorAbsent,
    distractorHigh,
    distractorLow
    );

// Randomize order:
trialLog = shuffle(conditionLog);