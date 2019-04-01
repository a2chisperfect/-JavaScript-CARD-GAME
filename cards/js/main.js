$().ready(function(){

	function Card(number)
	{
		this.Number = number;
		var self = this;
		this.getColor = function()
		{
			return self.Number%4;
		}
		this.getValue = function()
		{
			return Math.floor(self.Number/4) +2;
		}
		this.canBeat = function(otherCard, trump)
		{
			if(self.getColor() == otherCard.getColor())
				return self.getValue() > otherCard.getValue();
			else
				return self.getColor() == trump.getColor();

		}
		this.getHtml = function(show)
		{
			if(show)
			{
				return '<div class="card"><div class ="font" style="background:url(pcards//'+self.Number+'.png) no-repeat; background-size:contain;"></div> <div class="back" style="background:url(pcards//back.png) no-repeat; background-size:contain;"></div></div>'

			}
			else
			{
				return '<div class="card flipped"><div class ="font" style="background:url(pcards//'+self.Number+'.png) no-repeat; background-size:contain;"></div> <div class="back" style="background:url(pcards//back.png) no-repeat; background-size:contain;"></div></div>'
			}
		}
	}
	function Deck()
	{
		this.Cards = new Array();
		var self = this;
		this.getSize = function()
		{
			return self.Cards.length;
		}
		this.addCard = function(card)
		{
			self.Cards.push(card);
		}
		this.peekCard = function(index)
		{
			return self.Cards[index];
		}
		this.getCard = function(index)
		{
			if(typeof index !='undefined')
			{
				var tmp = self.Cards[index];
				self.Cards.splice(index,1);
				return tmp;
			}
			else
			{
				return self.Cards.pop();
			}

		}
		this.getHtml = function(show, deckView)
		{
			var tmp ='';		
			for (var i = 0; i < self.Cards.length; i++) {
				if(deckView && i == 0)
				{
					tmp+= self.Cards[i].getHtml(true);
					continue;
				}
				tmp+= self.Cards[i].getHtml(show);
			}
			return tmp;
		}
		this.shuffle = function()
		{
			var index;
			var tmp;
			for (var i = 0; i < self.Cards.length; i++) {
				index = Math.floor(Math.random()*i);
				tmp = self.Cards[i];
				self.Cards[i] = self.Cards[index];
				self.Cards[index] = tmp;
			}
		}
		this.getMinCardIndex = function()
		{
			var index = 0;
			for (var i = 0; i < self.Cards.length; i++) {
				if(self.Cards[index].getValue() > self.Cards[i].getValue())
				{
					index = i;
				}
			}
			return index;
		}
		this.getMinBeatCardIndex = function(card,trump)
		{
			for (var i = 0; i < self.Cards.length; i++) {
				if(self.Cards[i].canBeat(card,trump))
				{
					return i;
				}
			}
		}
		this.getMinTrump = function(card)
		{
			var tmp = null;
			for (var i = 0; i < self.Cards.length; i++) {
				if(tmp == null && self.Cards[i].getColor() == card.getColor())
				{
					tmp= self.Cards[i];
				}
				else if(self.Cards[i].getColor() == card.getColor() && self.Cards[i].getValue() < tmp.getValue())
				{
					tmp= self.Cards[i];
				}
			}
			return tmp;
		}
	}

	function stack_cards(step)
	{
		var left = 0;
		var i= 0;
		var cards = $('#deck div.card');
		cards.each(function(){
			if($(this)[0] == cards[0])
			{
				$(this).css({position:'absolute',left:83+'px',top:'-50px',zIndex: i});
				return true;
			}
			$(this).css({position:'absolute',left:left+'px',top:'0px',zIndex : i});
			left+=step;		
		});
	}
	function Game()
	{
		var self = this;
		var GameStarted;
		this.GlobalDeck;
		this.PlayerDeck;
		this.ComputerDeck;
		this.TableDeck;
		this.Move;
		var NextTurn;
		this.Trump;

		this.playerTable;
		this.computerTable;
		this.deckTable;
		this.cardsTable;
		
		function CreateDeck() 
		{
			for (var i = 0; i < 52; i++) {
				self.GlobalDeck.addCard(new Card(i));
			}
			self.GlobalDeck.shuffle();
			self.deckTable = document.getElementById('deck');
			self.deckTable.innerHTML += self.GlobalDeck.getHtml(false,true);
			stack_cards(0.25);
			self.Trump = self.GlobalDeck.peekCard(0);
		}
		
		
		function GiveOutCard(card)
		{
			var deckOffset = $('#deck').offset();
			var x = $(card).offset().left-deckOffset.left+'px';
			var y = $(card).offset().top-deckOffset.top+'px';
			var p = $(card).parent();

			$('#deck div.card:last-child').animate({left:x,top:y},"normal",function(){
				if($(card).parent().is('#playerTable') && $(this).hasClass('flipped'))
				{
					$(this).toggleClass('flipped');
					$(this).on('transitionend',function(){
						$(card).remove();
						$(this).clone().css('position','static').appendTo($(p));
						$(this).remove();
					});	
				}
				else
				{
					if(!$(this).hasClass('flipped') && !$(card).parent().is('#playerTable'))
					{
						$(this).toggleClass('flipped');
						$(this).on('transitionend',function(){
							$(card).remove();
							$(this).clone().css('position','static').appendTo($(p));
							$(this).remove();
						});	
					}
					else
					{
						$(card).remove();
						$(this).clone().css('position','static').appendTo($(p));
						$(this).remove();
					}
				}
				
			});
		}
		

		function GiveOutCards()
		{	
			var turn = 'Player';
			var card;
			var m = setInterval(function(){
				if(self.PlayerDeck.getSize() >= 6 && self.ComputerDeck.getSize() >= 6 || self.GlobalDeck.getSize() == 0)
				{
					clearInterval(m);
					if(!GameStarted)
					{
						FirstTurn();
						GameStarted = true;
					}
					else
					{
						StartTurn();
					}
					return;
				}
				if(turn =="Player" && self.PlayerDeck.getSize()<6)
				{
					self.PlayerDeck.addCard(self.GlobalDeck.getCard());
					$('#playerTable').append("<div class ='card'></div>");
					card = $('#playerTable div.card:last-child');
				}
				if(turn =="Computer" && self.ComputerDeck.getSize()<6)
				{
					self.ComputerDeck.addCard(self.GlobalDeck.getCard());
					$('#computerTable').append("<div class ='card'></div>");
					card = $('#computerTable div.card:last-child');
				}
				if(card)
				{
					GiveOutCard(card);
				}
				turn = turn=="Player"?"Computer":"Player";
				},700);
		}
		function FirstTurn()
		{
			if(self.PlayerDeck.getMinTrump(self.Trump) == null && self.ComputerDeck.getMinTrump(self.Trump)!= null)
			{
				self.Move = 'Computer';
			}
			else if (self.PlayerDeck.getMinTrump(self.Trump) != null && self.ComputerDeck.getMinTrump(self.Trump)== null)
			{
				self.Move = 'Player';
			}
			else if (self.PlayerDeck.getMinTrump(self.Trump) == null && self.ComputerDeck.getMinTrump(self.Trump)== null)
			{
				self.Move = 'Computer';
			}
			else
			{
				self.Move = self.PlayerDeck.getMinTrump(self.Trump).getValue() > self.ComputerDeck.getMinTrump(self.Trump).getValue()?'Player':'Computer';
			}
		}

		function PlaceCard(card)
		{
			var x = $(card).offset().left+'px';
			var y = $(card).offset().top+'px';
			var c_y = $('#cardsTable').offset().top + $('#cardsTable').innerHeight()/2-$(card).innerHeight()/2;
			var	c_x = $('#cardsTable').offset().left + $('#cardsTable').innerWidth()/2-$(card).innerWidth()/2;
			if(self.TableDeck.getSize() >1)
			{
				c_y-=$(card).innerHeight()/5;
				c_x+=$(card).innerWidth()/5;
			}
			$(card).children(0).css('margin-top','0px');
			$(card).clone().css({position:'absolute',margin:'0',top:y,left:x}).appendTo($('#cardsTable'));
			$(card).remove();
			$('#cardsTable div.card:last-child').animate({left:c_x+'px',top:c_y+'px'},"fast",function(){
				if($('#cardsTable div.card:last-child').hasClass('flipped'))
				{
					$('#cardsTable div.card:last-child').toggleClass('flipped');
				}
			});
		}
		function EndTurn()
		{
			self.Move = null;
			if(self.TableDeck.getSize() == 2)
			{
				setTimeout(ClearTable,200);
				self.TableDeck.getCard(0);
				self.TableDeck.getCard(0);
				GiveOutCards();
				return;
			}
			else if(self.TableDeck.getSize() == 0)
			{
				GiveOutCards();
				return;
			}
			if(g.PlayerDeck.getSize() == 0 || g.ComputerDeck.getSize() == 0)
			{
				if(g.PlayerDeck.getSize() == 0)
				{
					alert("You win");
				}
				else if(g.ComputerDeck.getSize() == 0)
				{
					alert("Computer win");
				}
				else
				{
					alert("Draw");
				}
				return;
			}
			StartTurn();
		}
		function StartTurn()
		{
			self.Move = NextTurn;
		}
		function ClearTable()
		{
			$('#cardsTable div.card:first-child').animate({left:$('body').innerWidth()+'px'},"fast",function()
			{
				$(this).remove();
			});
			$('#cardsTable div.card:last-child').animate({left:$('body').innerWidth()+'px'},"fast",function(){
				$(this).remove();
			});
		}
		function TakeCard(card)
		{
			var x = $(card).offset().left+'px';
			var y = $(card).offset().top+'px';
			$('#cardsTable div.card:last-child').animate({left:x,top:y},"fast",function(){
				if($(card).parent().is('#computerTable'))
				{
					$(this).toggleClass('flipped');
				}
				$('#cardsTable div.card:last-child').clone().css({position:'static',margin:'1%',top:y,left:x}).appendTo($(card).parent());
				$(card).remove();
				$('#cardsTable div.card:last-child').remove();

			});
		}

		this.InitGame = function()
		{
			GameStarted=false;
			self.GlobalDeck = new Deck();
			self.PlayerDeck = new Deck();
			self.ComputerDeck = new Deck();
			self.TableDeck = new Deck();
			CreateDeck();
			GiveOutCards();
			self.playerTable = document.getElementById('playerTable');		
			$("#playerTable").on("mouseenter","div.card",function(event){
				$(event.target).parent().animate({ marginTop: '-50px'},"fast");
			});
			
			$("#playerTable").on("mouseleave","div.card",function(){
			  $(event.target).parent().animate({marginTop: '0'},"fast");
			 });
			$("#playerTable").on("click","div.card",function(event){
				if(self.Move =='Player')
				{
					var counter = 0;
					var card =  event.currentTarget;
					while(counter < self.playerTable.childElementCount)
					{

						if(self.playerTable.children[counter] == card)
						{
							break;
						}
						counter++;
					}
					if(self.TableDeck.getSize() == 0)
					{
						self.TableDeck.addCard(self.PlayerDeck.getCard(counter));
						PlaceCard(card);
						NextTurn = "Computer";
						setTimeout(EndTurn,300);
					}
					else
					{
						if(self.PlayerDeck.peekCard(counter).canBeat(self.TableDeck.peekCard(0),self.Trump))
						{
							self.TableDeck.addCard(self.PlayerDeck.getCard(counter));
							PlaceCard(card);
							NextTurn = "Player";
							setTimeout(EndTurn,300);
						}
						else
						{
							return;
						}
					}
				}
			})

			$("#cardsTable").on('click','div.card',function(event){
				if(self.Move =='Player')
				{
					self.PlayerDeck.addCard(self.TableDeck.getCard());
					$('#playerTable').append("<div class ='card'></div>");
					TakeCard($('#playerTable div.card:last-child'));
					NextTurn = "Computer";
					setTimeout(EndTurn,300);
				}
			});
		}

		this.Play = function()
		{
			var f = setInterval(function(){
				if(self.Move =='Computer')
				{
					if(self.TableDeck.getSize() == 0)
					{
						var index = self.ComputerDeck.getMinCardIndex();
						console.log(index);
						self.TableDeck.addCard(self.ComputerDeck.getCard(index));
						PlaceCard($('#computerTable').children().eq(index));
						NextTurn = "Player";
						setTimeout(EndTurn,300);
					}
					else
					{
						var index = self.ComputerDeck.getMinBeatCardIndex(self.TableDeck.peekCard(0),self.Trump)
						console.log(index);
						if(index == null)
						{
							self.ComputerDeck.addCard(self.TableDeck.getCard(0));
							$('#computerTable').append("<div class ='card'></div>");
							TakeCard($('#computerTable div.card:last-child'));
							NextTurn = "Player";
							setTimeout(EndTurn,300);
						}
						else
						{
							self.TableDeck.addCard(self.ComputerDeck.getCard(index));
							PlaceCard($('#computerTable').children().eq(index));
							NextTurn ="Computer";
							setTimeout(EndTurn,300);
						} 
					}
				}
			},700);
		}
	}
	var g = new Game();
	g.InitGame();
	g.Play();
});