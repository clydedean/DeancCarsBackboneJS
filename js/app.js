$(function() {

    // Dean Clyde Villegas BSIT4B CROSSPLATFORMDEV
    //sir enoc backbone js car dealership app
    //must read: sir waka ga send code reference ani sa gc :( or gclass 

    const Car = Backbone.Model.extend({
        defaults: {
            brand: 'Unknown',
            model: 'New Model',
            price: 0,
            image: 'img/Placeholder.jpg'
        }
    });

    const Client = Backbone.Model.extend({
        defaults: { name: 'N/A', card: '****', address: 'N/A', purchasedCar: 'N/A' }
    });

     
    // COLLECTIONS (In-Memory Only Bye bye when page refreshes)
     

    const Inventory = Backbone.Collection.extend({ 
        model: Car
    });

    const ClientList = Backbone.Collection.extend({ model: Client });

    const inventory = new Inventory();
    const clientList = new ClientList();

     
    // 3. VIEWS
     

    const CarView = Backbone.View.extend({
        tagName: 'div',
        className: 'car_card',
        template: _.template($('#car-card-template').html()),

        events: {
            'click .buy_button': 'buyCar',
            'click .delete_link': 'deleteCar',
            'click .edit_link': 'editCar'
        },

        initialize: function() {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

        deleteCar: function() {
            const $modal = $('#custom-modal');
            const $confirmBtn = $('#modal-confirm');
            const $cancelBtn = $('#modal-cancel');

            $modal.fadeIn(200);

            $confirmBtn.off('click').on('click', () => {
                this.model.destroy();
                $modal.fadeOut(200);
            });

            $cancelBtn.off('click').on('click', () => {
                $modal.fadeOut(200);
            });
        },

        editCar: function() {
            app.trigger('edit:request', this.model);
            document.querySelector('.admin_area').scrollIntoView({behavior: 'smooth'});
        },

        buyCar: function() {
            const name = prompt("To finalize purchase, please enter your Full Name:");
            if (!name) return;
            const card = prompt("Enter Card Details:");
            const address = prompt("Enter Delivery Address:");

            clientList.add({
                name: name, card: card, address: address, purchasedCar: this.model.get('model')
            });

            alert(`Congratulations ${name}. Your ${this.model.get('brand')} ${this.model.get('model')} will be delivered to ${address}.`);
            
            app.trigger('client:purchase');
        }
    });
    
    const ClientRowView = Backbone.View.extend({
        tagName: 'tr',
        template: _.template($('#client-row-template').html()),
        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }
    });


    // main app view

    const AppView = Backbone.View.extend({
        el: 'body',

        events: {
            'click #hero-buy-btn': 'revealShowroom',
            'click #add-car-btn': 'addCar',
            'click #update-car-btn': 'updateCar',
            'click #cancel-edit-btn': 'cancelEdit',
            'change #input-img': 'handleFileSelect'
        },

        initialize: function() {
            this.$showroom = this.$('#showroom');
            this.$inventory = this.$('#car-inventory');
            this.$clientTableBody = this.$('#client_table_body');
            
            this.$brand = this.$('#input-brand');
            this.$model = this.$('#input-model');
            this.$price = this.$('#input-price');
            this.$fileInput = this.$('#input-img');
            this.$preview = this.$('#admin-img-preview');

            this.$addBtn = this.$('#add-car-btn');
            this.$updateBtn = this.$('#update-car-btn');
            this.$cancelBtn = this.$('#cancel-edit-btn');

            this.currentFilename = null;

            this.listenTo(inventory, 'add', this.addOne);
            this.listenTo(this, 'edit:request', this.enterEditMode);
            this.listenTo(this, 'client:purchase', this.addAllClients);

            this.loadInitialData();
            this.addAllClients();
        },

        //client logic

        addAllClients: function() {
            this.$clientTableBody.html('');
            clientList.each(this.addOneClient, this);
        },
        addOneClient: function(client) {
            const view = new ClientRowView({ model: client });
            this.$clientTableBody.append(view.render().el);
        },


        validateForm: function() {
            const brand = this.$brand.val().trim();
            const model = this.$model.val().trim();
            const price = Number(this.$price.val());

            if (!brand || !model || price <= 0 || isNaN(price)) {
                alert("Please ensure the Brand, Model, and Price are filled correctly (Price must be a positive number).");
                return false;
            }
            return true;
        },

        loadInitialData: function() {
            const initialCars = [
                { brand: 'Rolls Royce', model: 'Phantom', price: 28000000, image: 'img/rollsroyce.jpg' },
                { brand: 'Bentley', model: 'Continental GT', price: 16500000, image: 'img/bentleycontinentalgt.jpg' },
                { brand: 'Ferrari', model: 'SF90 Stradale', price: 35000000, image: 'img/Ferrari.jpg' },
                { brand: 'Lamborghini', model: 'Revuelto', price: 38000000, image: 'img/LamborghiniRevuelto.jpg' },
                { brand: 'Aston Martin', model: 'DBS', price: 19000000, image: 'img/AstonMartinDBS.jpg' }
            ];
            
            inventory.add(initialCars); 
        },

        addOne: function(car) {
            const view = new CarView({ model: car });
            this.$inventory.append(view.render().el);
        },

        revealShowroom: function() {
            this.$showroom.show(); 
            const showroomTop = this.$showroom.offset().top;
            $('html, body').animate({ scrollTop: showroomTop }, 300);
        },

        handleFileSelect: function(e) {
            const file = e.target.files[0];
            if (file) {
                // preview file 
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.$preview.attr('src', event.target.result);
                };
                reader.readAsDataURL(file);
                
                // store filename
                this.currentFilename = 'img/' + file.name;
            } else {
                this.currentFilename = null;
            }
        },

        addCar: function() {
            if (!this.validateForm()) return;
            if (!this.currentFilename) {
                 alert("Please select an image file to upload.");
                 return;
            }

            inventory.add({ 
                brand: this.$brand.val(),
                model: this.$model.val(),
                price: Number(this.$price.val()),
                image: this.currentFilename 
            });
            this.clearForm();
        },

        enterEditMode: function(model) {
            this.editingModel = model;
            
            this.$brand.val(model.get('brand'));
            this.$model.val(model.get('model'));
            this.$price.val(model.get('price'));
            
            this.$preview.attr('src', model.get('image'));
            
            // clear curr upload
            this.currentFilename = null;
            this.$fileInput.val('');

            this.$addBtn.hide();
            this.$updateBtn.show();
            this.$cancelBtn.show();
        },

        updateCar: function() {
            if (!this.validateForm()) return;

            if (this.editingModel) {
                const newData = {
                    brand: this.$brand.val(),
                    model: this.$model.val(),
                    price: Number(this.$price.val()),
                    // If a new file is selected, use the new path; otherwise, use the old model image path.
                    image: this.currentFilename || this.editingModel.get('image')
                };

                this.editingModel.set(newData);
                
                this.cancelEdit();
                $('html, body').animate({ scrollTop: $("#showroom").offset().top }, 500);
            }
        },

        cancelEdit: function() {
            this.editingModel = null;
            this.clearForm();
            
            this.$updateBtn.hide();
            this.$cancelBtn.hide();
            this.$addBtn.show();
        },

        clearForm: function() {
            this.editingModel = null;
            this.$brand.val('');
            this.$model.val('');
            this.$price.val('');
            this.$fileInput.val('');
            this.currentFilename = null;
            this.$preview.attr('src', 'img/Placeholder.jpg');
        }
    });

    const app = new AppView();
});