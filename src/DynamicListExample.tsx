import { useState } from 'react'


export function DynamicListExample(){
  const [items, setItems] = useState(['Item 1', 'Item 2', 'Item 3']);
  const [inputValue, setInputValue] = useState('');


  const addItem=()=>{
    if(inputValue.trim()){
        setItems([...items,inputValue]);
        setInputValue('');
    }
    
  };

  const removeItem=(indexToRemove)=>{
    setItems(items.filter((_,index)=>index!==indexToRemove));
  }


  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add new item"
        />
        <button onClick={addItem}>Add</button>
      </div>
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            {item}{' '}
            <button
              onClick={() => removeItem(index)}
              style={{ marginLeft: '10px' }}
            >
              ❌
            </button>
          </li>
        ))}
      </ul>
    </div>
  );


}