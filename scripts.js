window.BreakEvenCalc = new (function () {
    //constructor
    var Calc = function () {
        var self = this;
        this.elements = {
            buySide: document.querySelector('.buy-side'),
            sellSide: document.querySelector('.sell-side'),
            breakEven: document.querySelector('.break-even'),
            totalInvested: document.querySelector('.total-invested')
        }

        var addButtons = document.querySelectorAll('button.add-row');
        Array.prototype.forEach.call(addButtons, function(btn) {
            btn.addEventListener('click', self.addRow.bind(self));
        });

        document.querySelector('#fileInput').addEventListener('change', function (event) {
            self.resetForm();
            self.loadCSVData(event.target.files[0]);
        });

        document.querySelector('.load-csv').addEventListener('click', function () {
            document.querySelector('#fileInput').click();
        });

        document.body.addEventListener('input', this.onInputChange.bind(this));
    }

    Calc.prototype.resetForm = function () {
        this.elements.buySide.querySelector('ul').innerHTML = '';
        this.elements.sellSide.querySelector('ul').innerHTML = '';
    }

    Calc.prototype.addRow = function (ev) {
        var list = ev.target.parentElement.querySelector('ul');
        list.appendChild(this.getNewRow());
    }

    Calc.prototype.getNewRow = function () {
        var newRow = document.createElement('li');
        newRow.innerHTML = '<label class="six columns"><span>Amount: </span><input type="number" class="amount" /></label>' + 
            '<label class="six columns"><span>Price: </span><input type="number" class="price" /></label>';

        return newRow;
    }

    Calc.prototype.onInputChange = function (ev) {
        this.calculateBreakEven();
    }

    Calc.prototype.calculateBreakEven = function () {
        var coinsBought = this.getAmountSum(this.elements.buySide);
        var coinsSold = this.getAmountSum(this.elements.sellSide) || 0;
        var btcSpent = this.getBTCSpent(this.elements.buySide);
        var btcGained = this.getBTCSpent(this.elements.sellSide) || 0;

        var aveBuyPrice = btcSpent / coinsBought;
        var aveSellPrice = (btcGained / coinsSold) || 0;

        var breakEven = (btcSpent - btcGained) / (coinsBought - coinsSold);

        this.populateBreakEven(breakEven.toFixed(8));
        this.populateTotalSpent((aveBuyPrice * (coinsBought - coinsSold)).toFixed(8));
    }

    Calc.prototype.getAmountSum = function (side) {
        var amountInputs = side.querySelectorAll('input.amount');
        var sum = 0;

        for (var i = 0; i < amountInputs.length; i++) {
            if (!isNaN(amountInputs[i].value)) {
                sum += parseFloat(amountInputs[i].value);
            }
        }

        return sum;
    }

    Calc.prototype.getBTCSpent = function (side) {
        var amountInputs = side.querySelectorAll('input.amount');
        var priceInputs = side.querySelectorAll('input.price');
        var btcTotal = 0;
        for (var i = 0; i < amountInputs.length; i++) {
            if (!isNaN(amountInputs[i].value) && !isNaN(priceInputs[i].value)) {
                var amountSpent = parseFloat(amountInputs[i].value) * parseFloat(priceInputs[i].value);
                amountSpent = amountSpent + (amountSpent * 0.0025);   //subtract commission
                btcTotal += amountSpent;
            }
        }

        return btcTotal;
    }

    Calc.prototype.populateBreakEven = function (value) {
        this.elements.breakEven.innerHTML = value;
    }

    Calc.prototype.populateTotalSpent = function (value) {
        this.elements.totalInvested.innerHTML = value;
    }

    Calc.prototype.loadCSVData = function (file, encoding) {
        var self = this;

        Papa.parse(file, {
            header: true,
            complete: function (results, file) {
                if (results.errors[0] && results.errors[0].code === "UndetectableDelimiter") {
                    if (encoding === 'UTF8') {
                        return; //quit trying, already tried UTF8 encoding and it still didn't work
                    }
                    //try alternate encoding as I seem to get different file encodings from bittrex at different times
                    self.loadCSVData(file, 'UTF8');
                } else {
                    self.addCSVData(results.data);
                }
            },
            encoding: encoding || 'Unicode'
        });
    }

    Calc.prototype.addCSVData = function (data) {
        var coinsBoughtProp = this.getObjectProperty('Units Filled', data[0]) || this.getObjectProperty('Quantity', data[0]) || this.getObjectProperty('Amount', data[0]);
        var costProp = this.getObjectProperty('Actual Rate', data[0]) || this.getObjectProperty('Limit', data[0]) || this.getObjectProperty('Price', data[0]);
        var commissionProp = this.getObjectProperty('Commission', data[0]) || this.getObjectProperty('Fee', data[0]);
        for (var i = 0; i < data.length; i++) {
            if (data[i].Type) {
                var isBuy = data[i].Type.toUpperCase().indexOf('BUY') > -1;
                this.addCSVRow(data[i][coinsBoughtProp], data[i][costProp], isBuy);
            }
        }

        //caclulate result
        this.calculateBreakEven();
    }

    Calc.prototype.getObjectProperty = function (propStr, obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                if (prop.indexOf(propStr) > -1) {
                    return prop;
                }
            }
        }
    }

    Calc.prototype.addCSVRow = function (coins, cost, isBuySide) {
        var listEl = isBuySide ? this.elements.buySide.querySelector('ul') : this.elements.sellSide.querySelector('ul');
        var newRow = this.getNewRow();
        newRow.querySelector('input.amount').value = coins;
        newRow.querySelector('input.price').value = Math.abs(cost);
        listEl.appendChild(newRow);
    }

    return Calc;
}());



