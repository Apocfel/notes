import React from 'react';
import './App.css';

/*Постройка макета страницы*/
function App() {
  return (
    <NoteManager/>
  );
}

class NoteManager extends React.Component{

  constructor(props){
    super(props);
    let localArr = new Map();
    let localSet = new Set();
    if(localStorage.getItem("array") !== undefined && localStorage.getItem("idArray"))
    {
      for (let entry of JSON.parse(localStorage.getItem("array")))
        localArr.set(entry[0],entry[1]);
      for(let entry of JSON.parse(localStorage.getItem("idArray")))
        localSet.add(entry);

      for(let note of localArr){
        note[1].createTime = new Date(Date.parse(note[1].createTime));
      }
    }
    this.state = {
      maxNoteCount: 25,      
      currentNoteId : -1,
      idArray : localSet,
      array : localArr,
      config : {
        sort:"default",
        prefix:""
      }
    }
    this.noteAdding = this.noteAdding.bind(this);
    this.noteChanged = this.noteChanged.bind(this);
    this.noteSwitching = this.noteSwitching.bind(this);
    this.noteDelete = this.noteDelete.bind(this);    
    this.getNewId = this.getNewId.bind(this);
    this.prefixChange = this.prefixChange.bind(this);
    this.sortTypeChange = this.sortTypeChange.bind(this);
    this.localDataUpdate = this.localDataUpdate.bind(this);

    
  }
  //Обновление localStorage
  //ффункция для парса Date форматов
  replacer(key, value) {
       if (this[key] instanceof Date) {
          return this[key].toUTCString();
       }       
       return value;
  }
  localDataUpdate(){    
    let rep = this.replacer;
    let mapArr = JSON.stringify(Array.from(this.state.array), rep);   
    localStorage.setItem("array", mapArr);
    let setArr = JSON.stringify(Array.from(this.state.idArray));   
    localStorage.setItem("idArray",setArr);
  }
  //Возвращает новый уникальный id
  getNewId(){
    if(this.state.idArray.size >= this.state.maxNoteCount){
      return -1;
    }
    let tempId = 0;
    while(this.state.idArray.has(tempId)){
      tempId++;
    }
    let tempSet = this.state.idArray;
    tempSet.add(tempId);
    this.setState({
      idArray:tempSet 
    });
    return tempId;
  } 
  
  //Добавление новых заметок в array 
  noteAdding (note) {
    if (note.id == -1){
      alert("Было создано слишком много заметок");
      return;
    }
    if (this.state.array.get(note.id) === undefined)
      this.setState({
         array: this.state.array.set(note.id, note) 
       });
    //Переключаемся на добавленную записку
      this.setState({
        currentNoteId:note.id 
      });
      this.localDataUpdate();
  }
  //Изменение текста заметки
  noteChanged(text){
    if(this.state.currentNoteId == -1)
      return;
    let arr = this.state.array;
    arr.get(this.state.currentNoteId).content = text;
    this.setState({
      array: arr      
    });
    this.localDataUpdate();
  }
  //Переключение между заметками
  noteSwitching(id){
    this.setState({
      currentNoteId:id
    });
  }
  //Удаление заметки
  noteDelete(id){
    if (!this.state.array.has(id) || this.state.currentNoteId == -1)
      return;
    let newArr = this.state.array;
    newArr.delete(id);
    this.setState({
      array: newArr 
    });
    //Если удалили текущую заметку, то снимаем фокус 
    if(this.state.currentNoteId == id){
      this.setState({
        currentNoteId: -1 
      });
    }
    //Удаляем использованный id
    let tempSet = this.state.idArray;
    tempSet.delete(id);
    this.setState({
      idArray:tempSet 
    });  
    this.localDataUpdate();
  }
  //Изменение config
  prefixChange(prefix){
    let newConfig = this.state.config;
    newConfig.prefix = prefix;
    this.setState({
      config: newConfig
    });
  }
  sortTypeChange(sortType){
    let newConfig = this.state.config;
    newConfig.sort = sortType;
    this.setState({
      config: newConfig
    });
  }
  render(){
    return (
    <div className = "App">      
      <div className = "left">
        <ControlContainer
          handleSelect = {this.sortTypeChange}
          handleClick = {this.noteAdding}
          handleInput = {this.prefixChange}
          getNewId = {this.getNewId}
        />
        <MassContainer 
          handleDelete = {this.noteDelete}
          getId = {this.getNewId}
          array = {this.state.array}
          handleSwitch = {this.noteSwitching}
          config = {this.state.config}
        />
      </div>      
      <div className = "right">
        <NoteRedaction
          currentNoteId = {this.state.currentNoteId}          
          currentNote = {this.state.array.get(this.state.currentNoteId)}
          handleInput = {this.noteChanged}
          handleDelete = {this.noteDelete}
        />
      </div> 

    </div>
  );
  }
}

function ControlContainer(props){
  return (
    <div className = "container-column">      
      <Button value = "+Заметка" 
      handleClick = 
        {(evt) => props.handleClick(new Note("",new Date(),props.getNewId()))}
      />
      <Input 
      placeholder = "Поиск..." 
      className = "search"      
      handleInput = {(evt) => props.handleInput(evt.target.value)}
      />
      <div className = "container-row">
        <p>Сортировать по </p>
        <Select className = "menu"
        handleSelect = {props.handleSelect}
        />
      </div>
      
    </div>
  );
}
function Select(props){
  return (
      <select 
        onChange = {(evt) => props.handleSelect(evt.target.value)}
        type = "text" 
        className = {props.className}>
          <option value = "descend">убыванию даты</option>
          <option value = "ascend">возрастанию даты</option>
      </select>
    );
}
function MassContainer(props){
  return (
    <div className = "container-column">           
      {getNoteItemsFrom(props.array, props.handleSwitch, props.handleDelete, props.config)}   
    </div>
  );
}
class NoteRedaction extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      readOnly:true,
      toogleText: "Редактировать",
      placeholderText : "Выберите заметку слева."
    }
    this.toogle = this.toogle.bind(this);
  }
  toogle(){
    this.setState({
      readOnly: !this.state.readOnly 
    });
    if(!this.state.readOnly)
      this.setState({        
        toogleText: "Редактировать" 
      });    
    else{
      this.setState({
            toogleText:"Прекратить редактирование"
          });      
    }    
  }
  render(){
    return (
      <div className = "container-column">
        <div className = "container-row">
          <Button value = {this.state.toogleText}
            handleClick = {this.toogle}
          />
          <Button value = "Удалить"
            handleClick = {(evt) => this.props.handleDelete(this.props.currentNoteId)}
          />
        </div>      
        <TextArea
        maxLength = {500}
        readOnly = {this.state.readOnly}
        value = {this.props.currentNote == undefined ? "" : this.props.currentNote.content} 
        placeholder = {this.props.currentNoteId == -1? "Выберите заметку слева." : "Введите текст заметки..."}
        className = "note-content"
        handleInput = {
          (evt) => this.props.handleInput(evt.target.value)
        }
        />
      </div>
      
    );  
  }
}
//Сортирует массив (key,Note) в зависимости от config
function sortByConfig(noteArr,config){
  if (config === undefined)
    return noteArr;

  let newArr = [];
  //Пригодность по config.prefix
  if(config.prefix.trim() == '')
    newArr = noteArr;
  else
    for(let entry of noteArr){    
      if(entry[1]
        .content.toUpperCase().trim()
        .startsWith(
          config.prefix
            .toUpperCase().trim()))
        newArr.push(entry);    
    }
  
  //сортировка в зависимости от config.sort
  if(config.sort == "default" || config.sort == "ascend")
    newArr.sort((first,second) => 
     first[1].createTime - second[1].createTime)
  if(config.sort == "descend")
    newArr.sort((first,second) => 
     second[1].createTime - first[1].createTime)
  return newArr;
}
function getNoteItemsFrom(noteArr, handleClick, handleDelete, config){
  let arrayToShow = sortByConfig(Array.from(noteArr), config);
  return arrayToShow.map(([key, value]) => ( 
    <NoteItem
        handleDelete = {handleDelete}
        key = {value.id}
        func = {handleClick}
        id = {value.id}
        heading = {
          contentFrom(value.content)[0]
        }
        text = {contentFrom(value.content)[1]}
      /> 
  ));
}

class NoteItem extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      heading: props.heading,
      text: props.text,
      id: props.id,
    }
  }  
  render(){
    return(
      <div 
      key = {this.props.key}
      className = "note-item" 
      onClick = {(evt) => this.props.func(this.state.id)}
      >      
        <p className = "heading">{this.props.heading}</p>
        <p className = "text-preview">{this.props.text}</p>
        <button 
        className = "hide-button"
        onClick = {(evt) => (this.props.handleDelete(this.state.id))}                 
        >        
        {"X"}
      </button>
      </div>
    );
  }
}
/*Классы*/
class Button extends React.Component{
  constructor(props){
    super(props);

    this.handleClick = props.handleClick;
    //Если функция задана, то делаем привязку к this
    if(this.handleClick !== undefined)
      this.handleClick = this.handleClick.bind(this);
  }  
  render(){
    return(
      <button 
        className = "simple-button" 
        onClick = {this.handleClick}
      >
        {this.props.value}
      </button>
    );
  }
}
class Input extends React.Component{
  constructor(props){
    super(props);
    this.handleInput = props.handleInput;    
    //Если функция задана, то делаем привязку к this
    if(this.handleInput !== undefined)
      this.handleInput = this.handleInput.bind(this);
  }
  render() {
    return (
      <input 
        onInput = {this.handleInput}
        type = "text" 
        placeholder = {this.props.placeholder}
        className = {this.props.className}
      />
    );
  }
}
class TextArea extends React.Component{
  constructor(props){
    super(props);
    this.handleInput = props.handleInput;    
    //Если функция задана, то делаем привязку к this
    if(this.handleInput !== undefined)
      this.handleInput = this.handleInput.bind(this);
  }
  render() {
    return (
      <textarea
        maxlength = {this.props.maxLength}
        value = {this.props.value} 
        type = "text" 
        onInput = {this.handleInput}
        placeholder = {this.props.placeholder}
        className = {this.props.className}
        readOnly = {this.props.readOnly}
      />
    );
  }
}

/**/

class Note{
  constructor(content = "", createTime = new Date(), id){
    this.content = content;
    this.createTime = createTime;
    this.id = id;
    this.heading = "";
    this.text = "";
  }
  get heading(){
    return contentFrom(this.content)[0];
  }
  get text(){
    return contentFrom(this.content)[1];
  }
  set heading(value){
    
  } 
  set text(value){
    
  }
}
/**/
function contentFrom(text, maxlength = 15){
    let res = [];
    //Возвращает массив из 2х элементов, где первый элемент Заголовок, а второй это текст
    let indOfNewLine = text.indexOf('\n');
    //Если нету переноса на новую строку
    if(indOfNewLine === -1){    
        res.push(text.substring(0, maxlength));
        res.push('');
        return res;
    }
    res.push(text
        .substr(0,indOfNewLine)
        .substring(0,maxlength));
    res.push(text.slice(indOfNewLine+1));
    return res;
  }

export default App;