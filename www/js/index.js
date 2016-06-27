
$(document).ready(function () {
    $('#uploadFilePath').change(function(e) {
        var files = e.target.files;
        var data = new FormData();
        data.append('fileupload', files[0]);
        doUpload(data);
   });

   signinAndSubscribe(function(notification) {
     console.log(notification);
     signinAndView(notification.message[0].urn);
   })

});

var doUpload = function(formdata) {
 $("#upload-status").text('uploading..');
 $.ajax({
        url: '/api/upload',
        type: 'POST',
        data: formdata,
        cache: false,
        dataType: 'json',
        processData: false, // Don't process the files
        contentType: false, // Set content type to false as jQuery will tell the server its a query string request
        success: function(result)  {
          registerView(result.urn);
        }
    });

};

var registerView = function(urn) {
  $.post('/api/register', { urn: urn }, function(result) {
      getViewStatus(urn);
   });  
};

var getViewStatus = function(urn) {
  $.get('/api/viewStatus', { urn: urn }, function(result) {
      result = JSON.parse(result);
      $("#upload-status").text(result.progress);
      console.log(result);
      if(result.progress !== 'complete' ) {
        setTimeout(getViewStatus.bind(this, urn), 3000);
      } else {
        sendNotification(urn);    // viewing goes through notifications
     }
   });  
};

var signinAndView = function(urn) {
  $.post('/api/signin', function(authToken) {
      runViewer(authToken.access_token, 'urn:' + urn);
  });  
};

var runViewer = function(token, docID) {
  var viewerApp;
    var options = {
           env: 'AutodeskStaging',
           accessToken: token
    };
    var documentId = docID;
    Autodesk.Viewing.Initializer(options, function onInitialized(){
        viewerApp = new Autodesk.A360ViewingApplication('viewerDiv');
        viewerApp.registerViewer(viewerApp.k3D, Autodesk.Viewing.Private.GuiViewer3D);
        viewerApp.loadDocumentWithItemAndObject(documentId);
        $("#upload-status").text('');

    });

};
