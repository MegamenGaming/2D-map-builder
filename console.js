//declare the variables from the HTML file
var consoleDiv = document.getElementById("console");
var consoleBox = document.getElementById("consoleBox");

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