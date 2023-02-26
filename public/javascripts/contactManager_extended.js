class Model {
  constructor() {
    this.contacts = [];
    this.getContacts();
  }

  getContact(id) {
    return this.contacts.filter(contact => String(contact.id) === String(id))[0];
  }

  getUniqueTags() {
    let unique = [];
    this.contacts.forEach(contact => {
      contact.tags.forEach(tag => {
        if (!unique.includes(tag)) {
          unique.push(tag);
        }
      })
    });
    return unique;
  }

  filterByTag(tag) {
    return this.contacts.filter(contact => {
       return contact.tags.includes(tag);
    });
  }

  filterBySearch(input) {
    return this.contacts.filter(contact => {
      return contact.full_name.slice(0, input.length).toLowerCase() === input.toLowerCase();
    });
  }
    
  async getContacts() {
    try {
      const response = await fetch("http://localhost:3000/api/contacts");
      const data = await response.json();
      this.contacts = data;
      return data;
    } catch (error) {
        throw error;    
    }
  }

  async addContact(data) {
    try {
      const response = await fetch("http://localhost:3000/api/contacts", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      await this.getContacts();
    } catch (error) {
      throw (error);
    }
  }

  async deleteContact(id) {
    try {
      const response = await fetch(`http://localhost:3000/api/contacts/${id}`, {
        method: 'DELETE'
      });
      await this.getContacts();
    } catch (error) {
      throw (error);
    }
  }
  
  async editContact(id, data) {
    try {
      const response = await fetch(`http://localhost:3000/api/contacts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      await this.getContacts();
    } catch (error) {
      throw (error);
    }
  }
}
  
class View {
  constructor() {
    this.contactsDiv = document.querySelector('.contacts');
    this.addContactForm = document.querySelector('#addContactForm')
    this.contactTemplate = Handlebars.compile(document.getElementById('contactTemplate').innerHTML);
    this.messageDiv = document.querySelector('.message');
    this.alert = document.querySelector('.alert');
    this.search = document.querySelector('#search');
    this.addContactButtons = document.querySelector('.addContact');
    this.form = document.querySelector('form');
    this.select = document.querySelector('select');
  }

  renderSelect(tags) {
    Array.from(this.select.children).forEach(child => {
      if (!child.classList.contains('keep')) {
        this.select.removeChild(child);
      }
    });
    tags.forEach(tag => {
      let option = document.createElement('option');
      option.value = tag;
      option.textContent = this.capitalize(tag);
      this.select.appendChild(option);
    });
  }

  capitalize(string) {
    return string.slice(0,1).toUpperCase() + string.slice(1, string.length);
  }

  hideElement(element) {
    if (!element.classList.contains('hidden')) {
      element.classList.add('hidden');
    }
  }

  showElement(element) {
    if (element.classList.contains('hidden')) {
      element.classList.remove('hidden');
    }
  }

  refreshView() {
    this.hideElement(this.addContactForm.parentNode);
    this.showElement(this.contactsDiv);
    
  }

  formView() {
    this.hideElement(this.contactsDiv);
    this.showElement(this.addContactForm.parentNode);
  }

  displayMessage(contacts) {
    if (contacts.length > 0) {
      this.hideElement(this.messageDiv);
    } else {
      this.showElement(this.messageDiv);
      this.messageDiv.firstElementChild.textContent = this.noContactsMessage();
    }
  }

  noContactsMessage() {
    if (this.search.value === '') {
      return "There are no contacts to display."
    } else {
      return `There are no contacts starting with ${this.search.value}.`;
    }
  }

  renderAllContacts(contacts) {
    Array.from(this.contactsDiv.children).forEach(child => this.contactsDiv.removeChild(child));
    contacts.forEach(contact =>  {
      if (!Array.isArray(contact.tags)) {
        contact.tags = contact.tags ? contact.tags.split(/\s?,\s?/) : [];
      }
    });
    this.contactsDiv.innerHTML = this.contactTemplate({'contacts': contacts});
    this.displayMessage(contacts);
  }
}
  
class Controller {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.activeID = null;
    this.renderInitialContacts();
  }

  resetForm() {
    let form = this.view.form;
    let inputs = Array.from(form.querySelectorAll('input'));
    inputs.forEach(input => {
      input.setAttribute('value', '');
      if (input.nextElementSibling) {
        input.nextElementSibling.textContent = '';
      }
    });
    document.querySelector('.form_errors').textContent = '';
    form.reset();
      
    if (this.activeID) {
      this.setFormDefaults(this.activeID);
    }
  }

  setOptions() {
    let tags = this.model.getUniqueTags();
    this.view.renderSelect(tags);
  }

  renderHome() {
    this.view.renderAllContacts(this.model.contacts);
    this.setOptions();
    this.view.refreshView();
  }

  setFormDefaults(id) {
    let contact = this.model.getContact(id);
    this.view.form.querySelector('#full_name').setAttribute('value', contact.full_name);
    this.view.form.querySelector('#email').setAttribute('value', contact.email);
    this.view.form.querySelector('#phone').setAttribute('value', contact.phone_number);
    this.view.form.querySelector('#tags').setAttribute('value', contact.tags);
  }

  validateInput(input) {
    if (input.validity.valueMissing) {
      this.handleValueAbsence(input);
      return false;
    } else if (input.validity.patternMismatch) {
      this.handlePatternMismatch(input);
      return false;
    }
    return true;
  }

  handlePatternMismatch(input) {
    let labelText = input.previousElementSibling.textContent.slice(0, -1).toLowerCase();
    let error = input.nextElementSibling;
    error.textContent = 'Please enter a valid ' + labelText + '.';

    input.classList.add('invalid_field');
  }

  handleValueAbsence(input) {
    let labelText = input.previousElementSibling.textContent.slice(0, -1);
    let error = input.nextElementSibling;
    error.textContent = labelText + ' is a required field.';

    input.classList.add('invalid_field');
  }

  validateFormInputs() {
    let self = this;
    [...document.querySelectorAll('form input')].forEach(element => {
      self.validateInput(element);
    });
  }

  async renderInitialContacts() {
    await this.model.getContacts();
    this.renderHome();
    this.view.addContactForm.parentNode.classList.add('hidden');
  }

  async addContact(data) {
    await this.model.addContact(data);
    this.renderHome();
  }

  async deleteContact(id) {
    await this.model.deleteContact(id);
    this.renderHome();
  }

  async editContact(id, data) {
    await this.model.editContact(id, data);
    this.renderHome();
  }    
}
  
document.addEventListener('DOMContentLoaded', () => {
  const app = new Controller(new Model(), new View());

  [...document.querySelectorAll('.addContact')].forEach(element => {
    element.addEventListener('click', event => {
      event.preventDefault();
      app.activeID = null;
      app.resetForm();
      app.view.addContactForm.querySelector('h2').textContent = "Create Contact";
      app.view.formView();
    });
  });

  document.querySelector('#cancelNewContact').addEventListener('click', event => {
    event.preventDefault();
    app.activeID = null;
    app.resetForm();
    app.view.refreshView();
  });

  document.querySelector('form').addEventListener('submit', event => {
    let form = event.target;
    event.preventDefault();
    app.view.hideElement(app.view.alert);
    let data = {
      'full_name': form.full_name.value,
      'email': form.email.value,
      'phone_number': form.phone.value,
      'tags': form.tags.value
    };
    if (form.checkValidity()) {
      document.querySelector('.form_errors').textContent = '';
      if (app.activeID === null) {
        app.addContact(data);
      } else {
        data.id = app.activeID;
        app.editContact(app.activeID, data);
        app.activeID = null;
      }
    } else {
      document.querySelector('.form_errors').textContent = 'Form cannot be submitted until errors are corrected.'
      app.validateFormInputs();
      setTimeout(() => {
        document.querySelector('.form_errors').textContent = '';
      }, 5000);

    }
    
  });

  [...document.querySelectorAll('form input')].forEach(element => {
    if (!element.nextElementSibling) return;
    element.addEventListener('blur', event => {
      let input = event.target;
      if (input.checkValidity()) {
        input.nextElementSibling.textContent = '';
      }
      app.validateInput(input);
    });

    element.addEventListener('focus', event => {
      let input = event.target;
      input.nextElementSibling.textContent = '';
      input.classList.remove('invalid_field'); 
    });
  });


  document.querySelector('.contacts').addEventListener('click', event => {
    event.preventDefault();
    if (event.target.classList.contains('deleteContact')) {
      let id = Number(event.target.getAttribute('data-id'));
      app.deleteContact(id);
    }
    if (event.target.classList.contains('editContact')) {
      app.activeID = Number(event.target.getAttribute('data-id'));
      app.view.addContactForm.querySelector('h2').textContent = "Edit Contact";
      app.view.hideElement(app.view.alert);
      app.resetForm();
      app.view.formView();
    }
    if (event.target.tagName === "A") {
      let contacts = app.model.filterByTag(event.target.textContent);
      app.view.renderAllContacts(contacts); 
      app.view.select.value = event.target.textContent;
      app.view.refreshView();
    }
  });

  document.querySelector('.showAll').addEventListener('click', event => {
    app.view.renderAllContacts(app.model.contacts); 
    app.view.select.value = "all";
    app.view.search.value = "";
    app.view.refreshView();
  });

  document.querySelector('#search').addEventListener('input', event => {
    let value = app.view.search.value;
    let contacts = app.model.filterBySearch(value);
    app.view.renderAllContacts(contacts); 
    app.view.refreshView();
  });

  document.querySelector('select').addEventListener('change', event => {
    let value = event.target.value;
    if (value === 'all') {
      document.querySelector('.showAll').click();
    } else {
      let contacts = app.model.filterByTag(value);
      app.view.renderAllContacts(contacts); 
      app.view.refreshView();
    }
  });



});
