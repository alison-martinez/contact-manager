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

  validateData(data) {
    return this.validateName(data.full_name) && this.validateNumber(data.phone_number) && this.validateEmail(data.email);
  }

  validateName(name) {
    if (name.length === 0) {
      this.view.alert.textContent = 'Full name is a required field.'
      this.view.alert.classList.remove('hidden');
    }
    return name.length > 0;
  }

  validateNumber(phone) {
    var phoneno = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (!phone.match(phoneno)) {
      this.view.alert.textContent = 'Please enter a valid phone number.'
      this.view.alert.classList.remove('hidden');
    }
    return phone.match(phoneno);
  }

  validateEmail(email) {
    var emailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!email.match(emailFormat)) {
      this.view.alert.textContent = 'Please enter a valid email address.'
      this.view.alert.classList.remove('hidden');
    }
    return email.match(emailFormat);
  }

  resetForm() {
    let form = this.view.form;
    let inputs = Array.from(form.querySelectorAll('input'));
    inputs.forEach(input => input.setAttribute('value', ''));
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
    if (app.validateData(data)) {
      if (app.activeID === null) {
        app.addContact(data);
      } else {
        data.id = app.activeID;
        app.editContact(app.activeID, data);
        app.activeID = null;
      }
    } else {
      app.resetForm();
    }
    
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
