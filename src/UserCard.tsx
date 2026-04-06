type userCardProbs ={
    name: string;
    role: 'admin' | 'user';
    verified: boolean;
    };

export const UserCard = ({name, role,verified}:userCardProbs) => {

    const alertUsername=(name:string)=>{
    alert(`hello, ${name}`);
  };
    return (
        <div style={
            {
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
            }
        }>
            <h2>{name}</h2>
            <p>{role}</p>
            {verified && <span>✅</span>}
            <button onClick={()=>{
                alertUsername(name)

            }}>User Info</button>
        </div>

    );
};