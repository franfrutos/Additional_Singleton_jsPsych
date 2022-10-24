
// Initialize jsPsych
const jsPsych = initJsPsych({
    on_finish: () => {
        jsPsych.data.displayData();
    }
});

// Run in JATOS server?
const jatos_run = window.jatos !== undefined || false;

const timeline = [];  

let verticalCount = 0; let trialNum = 0; let check_Num = 0;

const welcome = {
    type: jsPsychHtmlButtonResponse,
    stimulus: "<p>Experiment under construction.</p></br>",
    choices: ['Continue']
};

timeline.push(welcome);

// Instructions
const instructions1 = {
    type:jsPsychInstructions,
    pages: [
        '<p>This is an example of instruction page. Press the left arrow to continue.</p>',
        '<p>This is another page of the instructions.</p>',
        '<p>Now, You have to do the virtual chin-rest.</p>'
    ]
}

const instructions2 = {
    type:jsPsychInstructions,
    pages: [
        '<p>This is an example of instruction page before the experiment begins. Press the left arrow to continue.</p>',
        '<p>This is another page of the instructions.</p>',
        `<p><strong>Press C</strong> if you see a horizontal line inside the different shape.</p></br>
        <p><strong>Press F</strong> if you see a vertical line inside the different shape.</p></br>
        <p>Press the left arrow to start the experiment</p>`
    ],
    data: () => {
        // We need to save the scaling factor in every trial
        const sF  = jsPsych.data.get().last(1).values()[0].px2deg;
        return {
            px2deg: sF,
        }
    },
    on_finish: () => {
        //Fade to black transition
        document.body.classList.add("black");
        document.body.style.cursor = 'none';
    },
    post_trial_gap: 2000,
}
// Virtual chin-rest
const resize = {
    type: jsPsychVirtualChinrest,
    blindspot_reps: 3,
    resize_units: "none",
    post_trial_gap: 2000,
};


const full_on = {
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    //message: "<p>Antes de empezar, pulsa el botón para entrar en modo pantalla completa.</p>",
    button_label: "Enter fullscreen mode",
};

    const full_off = {
    type: jsPsychFullscreen,
    fullscreen_mode: false,
  };


    // Experimental trial

const trial = {
    type: jsPsychPsychophysics,
    stimuli: () => {
        const sF  = jsPsych.data.get().last(1).values()[0].px2deg;
        const targetPos = jsPsych.timelineVariable("targetPos");
        const singPos = jsPsych.timelineVariable("singPos");
        const dimension = jsPsych.timelineVariable("dimension");
        // Stimulus size is determined to an scaling factor that transform pixels to degrees of visual angle
        return draw_display(1*sF, 0.1*sF, 4*sF, dimension, targetPos, singPos, jsPsych.timelineVariable("orientation"));
    },
    choices: ['f', 'c'], 
    background_color: '#000000',
    canvas_width: () => {
        const sF  = jsPsych.data.get().last(1).values()[0].px2deg;
        return sF*11;
    },
    canvas_height: () => {
        const sF  = jsPsych.data.get().last(1).values()[0].px2deg;
        return sF*11;
    },
    data: () => {
        const sPos = jsPsych.timelineVariable("singPos")
        return {
            px2deg: jsPsych.data.get().last(1).values()[0].px2deg,
            tPos: jsPsych.timelineVariable("targetPos"),
            sPos: sPos,
            counterbalance: jsPsych.timelineVariable("dimension"),
            condition: (sPos < 0)? "Absent": (sPos === HPDL) ? "HPDL": "LPDL",
            verticalCount: (jsPsych.timelineVariable("orientation") == "vertical") ? verticalCount++: verticalCount,
            check: jsPsych.timelineVariable("WMcheck"),
            trial_num: ++trialNum,
            check_Num: (jsPsych.timelineVariable("WMcheck") == "yes")? ++check_Num : check_Num,
        }
    },
    on_finish: (data) => {
        data.correct_response = (jsPsych.timelineVariable("orientation") == "vertical") ? "f":"c";
        data.correct = (jsPsych.pluginAPI.compareKeys(data.response, data.correct_response))? 1: 0;
        // Resetting line counter
        console.log(data);
    },
    post_trial_gap: 500 + Math.floor(Math.random()*201),
    trial_duration: 3500,
    response_start_time: 500,
};

const WMtrial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: () => {
        const checkNum = jsPsych.data.get().last(1).values()[0].check_Num;
        const correct = shuffle([true, false])[0];
        const line = shuffle(["vertical", "horizontal"])[0];
        let num;
        const check_length = (WMlog[checkNum - 2] !== undefined)? WMlog[checkNum - 1] - WMlog[checkNum - 2] : WMlog[checkNum - 1];
        const numV = jsPsych.data.get().last(1).values()[0].verticalCount;
        const numH = Math.abs(check_length - numV);
        console.log(check_length);
        console.log(correct, line)
        if (correct && line === "vertical") {
            num = numV;
        } else if (correct && line === "horizontal") {
            num = numH;
        } else if (!correct && line === "vertical") {
            num = random(0, check_length, [numV]);
        } else {
            num = random(0, check_length, [numH]);
        }

        return `
        <p>The number of ${line} lines was: ${num}</p></br>
        <p>y/n</p>
        `
    },
    choices: ['y', 'n'],
    data: () => {
        const sPos = jsPsych.timelineVariable("singPos")
        return {
            px2deg: jsPsych.data.get().last(1).values()[0].px2deg,
            tPos: jsPsych.timelineVariable("targetPos"),
            sPos: sPos,
            counterbalance: jsPsych.timelineVariable("dimension"),
            condition: (sPos < 0)? "Absent": (sPos === HPDL) ? "HPDL": "LPDL",
            verticalCount: (jsPsych.timelineVariable("orientation") == "vertical") ? verticalCount++: verticalCount,
            check: jsPsych.timelineVariable("WMcheck"),
            trial_num: trialNum
        }
    },
    on_finish: () => {
        verticalCount = (jsPsych.timelineVariable("WMcheck") === "yes") ? 0 : verticalCount;
        jsPsych.data.get().last(1).values()[0].verticalCount.verticalCount = verticalCount;
    }
}

const rest = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: () => {
        return `
        <p>You have completed an experimental block</p></br>
        <p>Press the space bar to continue</p>
         `
    },
    choices: [' '],
    data: () => {
        const sPos = jsPsych.timelineVariable("singPos")
        return {
            px2deg: jsPsych.data.get().last(1).values()[0].px2deg,
            tPos: jsPsych.timelineVariable("targetPos"),
            sPos: sPos,
            counterbalance: jsPsych.timelineVariable("dimension"),
            condition: (sPos < 0)? "Absent": (sPos === HPDL) ? "HPDL": "LPDL",
            verticalCount: (jsPsych.timelineVariable("orientation") == "vertical") ? verticalCount++: verticalCount,
            check: jsPsych.timelineVariable("WMcheck"),
        }
    }
}

// Conditional show wm check and between bloocks rests
const if_nodeWM = {
    timeline: [WMtrial],
    conditional_function: () => {
        return (jsPsych.timelineVariable("WMcheck") == "yes");
    },
}

const if_nodeRest = {
    timeline: [rest],
        conditional_function: () => {
        const current_trial = jsPsych.data.get().last(1).values(0)[0].trial_num;
        return current_trial % 120 == 0 && current_trial != 720;
    },
}


const procedure = {
    timeline: [trial, if_nodeWM, if_nodeRest],
    timeline_variables: trialObj,
    repetitions: 1,
    randomize_order: false,
}

timeline.push(instructions1, full_on, resize, instructions2, procedure, full_off);

jsPsych.run(timeline);