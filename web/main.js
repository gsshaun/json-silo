/**
 * Copyright reelyActive 2015-2019
 * We believe in an open Internet of Things
 */


// Constants
const DEFAULT_IMAGE_PROPERTY_NAME = 'image';
const DEFAULT_STORY = {
    "@context": { "schema": "https://schema.org/" },
    "@graph": []
};
const DEFAULT_PERSON_ELEMENT = { "@id": "person", "@type": "schema:Person" };


// DOM elements
let queryBox = document.querySelector('#personName');
let personForm = document.querySelector('#personForm');
let personGivenName = document.querySelector('#personGivenName');
let personFamilyName = document.querySelector('#personFamilyName');
let personImageInput = document.querySelector('#personImageInput');
let submitButton = document.querySelector('#submitButton');
let visualPreview = document.querySelector('#visualPreview');
let storyPreview = document.querySelector('#storyPreview');
let storyUrl = document.querySelector('#storyUrl');
let error = document.querySelector('#error');

// Other variables
let story = { FullName: "", imageUrl: "" }; // TODO: remove
let personStory = Object.assign({}, DEFAULT_STORY);
let personElement = Object.assign({}, DEFAULT_PERSON_ELEMENT);
personStory['@graph'].push(personElement);
let personImgSrc;


/**
 * Uploads an image to the file system
 * @param {callback} callback Function to call upon completion
 */
function addImage(callback) {
  let formData = new FormData();
  formData.append(DEFAULT_IMAGE_PROPERTY_NAME, personImageInput.files[0]);

  let httpRequest = new XMLHttpRequest();
  httpRequest.onload = function(oevent){
    if(httpRequest.status === 200) {
      let response = JSON.parse(httpRequest.responseText);
      let imageLocation = 'images/' + response.imageName;
      personElement['schema:image'] = window.location.href + imageLocation;
      //update the DOM
      story.imageUrl = window.location.href + imageLocation;
      story.FullName = personGivenName.value + ' ' + personFamilyName.value;
      story = JSON.stringify(story);
      error.textContent = '';
      callback();
    }
    else if(httpRequest.status === 204) {
      error.textContent = 'wrong file format';
    }
    else if(httpRequest.status === 422) {
      error.textContent = 'We could not detect any file';
    }
    else {
      //textImage.textContent = 'something went wrong while uploading image';
    } 
  };
  httpRequest.open('POST', '/images', true);
  httpRequest.send(formData);  
} 


/**
 * Obtains story and sends it to the database
 */
function addStory() { 
  let httpRequest = new XMLHttpRequest();
  let personStoryString = JSON.stringify(personStory);
  httpRequest.onreadystatechange = function(){
    if(httpRequest.readyState === XMLHttpRequest.DONE) {
      if(httpRequest.status === 200) {
        story = JSON.stringify(story);
        let response = JSON.parse(httpRequest.responseText);
        let storyLocation = response._links.self.href + '/' + response.stories._id;
        storyUrl.textContent = storyLocation;
        storyUrl.href = storyLocation;
      }
    }
  };
  httpRequest.open('POST', '/stories');
  httpRequest.setRequestHeader('Content-Type', 'application/json');
  httpRequest.setRequestHeader('Accept', 'application/json');
  httpRequest.send(personStoryString);
}


// Update the person element
function updatePersonElement() {
  if(personGivenName.value === '') {
    delete personElement['schema:givenName'];
  }
  else {
    personElement['schema:givenName'] = personGivenName.value;
  }

  if(personFamilyName.value === '') {
    delete personElement['schema:familyName'];
  }
  else {
    personElement['schema:familyName'] = personFamilyName.value;
  }

  storyPreview.textContent = JSON.stringify(personStory, null, 2);
  while(visualPreview.firstChild) {
    visualPreview.removeChild(visualPreview.firstChild);
  }
  cuttlefish.render(personStory, visualPreview);
  name.textContent = personGivenName.value + ' ' + personFamilyName.value;
}


// Update the person's image source based on the uploaded image
function updatePersonImageSrc() {
  let input = this;
  if(input.files && input.files[0]) {
    let reader = new FileReader();
    
    reader.onload = function(e) {
      personImgSrc = e.target.result;
      personElement['schema:image'] = personImgSrc;
      while(visualPreview.firstChild) {
        visualPreview.removeChild(visualPreview.firstChild);
      }
      cuttlefish.render(personStory, visualPreview);
    }
    reader.readAsDataURL(input.files[0]);
  }
}

function publishStory() {
  addImage(function() { // TODO: handle errors when adding image
    addStory();
  });
}

personForm.addEventListener('keyup', updatePersonElement);
personImageInput.addEventListener('change', updatePersonImageSrc);
submitButton.addEventListener('click', publishStory);
