$(document).ready(function () {
    Skype.ui({
        name: "call",
        element: "SkypeCall",
        participants: ["echo123"],
        listParticipants: "true",
        imageSize: 32,
        imageColor: "white"
    });
    console.log("hi");
});