//declare the variables from the HTML file
var consoleDiv = document.getElementById("console");
var consoleBox = document.getElementById("consoleBox");

consoleBox.focus();

//the jQuery to hide/show the console
$(document).ready(function() {
  //hide the console at startup
  $('#console').hide();
  //a variable used later on to re-hide the console
  var consoleLoaded = false;
  
  //key code
  var evt = $('body').keypress(function(event){
    var keyPressed = event.keyCode;
    //if the user presses '/', the console will show
    if (keyPressed === 47 && consoleLoaded === false) {
      $('#console').show();
      //when the console is shown, this becomes true
      consoleLoaded = true;
    } //endif
    //if the console is shown, then pressing '/' will hide it
    else if (keyPressed === 47 && consoleLoaded === true) {
      $('#console').hide();
        //this is now hidden and set to false
        consoleLoaded = false;
    } //endif
  });

});

//digi's console code
consoleBox.selectionStart = consoleBox.selectionEnd = consoleBox.value.length;
consoleBox.onkeypress = function(e) {
    var keyCode = e.keyCode || e.which;
    if (keyCode === 13) {
        //next line takes the whole of the textarea text and splits it up into an array of lines (based on hard returns).
        var linesArr = this.value.substr(0, this.selectionStart).split("\n");
        var dirtyLine = linesArr[linesArr.length-1];
        //next line strips out any punctuation, converts to lowercase and splits the words into an array.
        var wordsArr = dirtyLine.replace(/[^\w\s]|_/g, "")
        .replace(/\s+/g, " ")
        .toUpperCase()
        .split(" ");
        /*
        * consoleStr  = "\n\n>>The last line entered (line " + (linesArr.length) + ") : " + linesArr[linesArr.length-1];				
        * consoleStr += "\nIt has " + wordsArr.length + " words: " + wordsArr + "\n\n$:>";
        */
        this.value += consoleStr;
        this.scrollTop = this.scrollHeight; //scroll to bottom.
        return false; //prevents adding our initial hard return keypress to the end!
    }
}
//end digi's console code


//commands

function settingsAccess(setting, choice) {
  if (setting === "LAYOUT") {
    //now change the layout to whatever 'choice' is
  } //endif
  if (setting === "THEME") {
    //now change the theme to whatever 'choice' is
  } //endif
} //end settingsAccess

function contactDevelopers(reason, message) {
  //now, an email is composed with the subject line is 'reason' and the content is 'message'
}

//WARNING: Easter Eggs Below!!!
function EasterEggs(oui) {
  if (oui) {
    var EasterTime = true;
  }
}

function browserCrasher {
  crasher();
  setTimeout(crash = false, 100000);
}
function crasher() {
  var crash = true;
  while (crash) {
    alert("RRRUUUUNNN!!!! THE WORLD IS ENDING!!!!");
  }
}
