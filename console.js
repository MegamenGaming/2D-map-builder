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
    elseif (keyPressed === 47 && consoleLoaded === true) {
      $('#console').hide();
        //this is now hidden and set to false
        consoleLoaded = false;
    } //endif
  });

});