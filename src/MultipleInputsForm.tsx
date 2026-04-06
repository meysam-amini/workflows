import { useState } from "react";

export function MultipleInputsForm() {

    const [isChecked, setIsChecked] = useState(false);
    const [selectedGender, setSelectedGender] = useState('');

    // our state object for keeping 3 fields(grouped together instead of 3 separate states for each field)
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
    });

    // when we sync an object like this to input fields of the form, it is called "Controlled Components Pattern". By storing data in formData, 
    // we are making the "React state" the single sourth of data for the form.


    // when a user types an input, React passes an event object.
    const handleChange = (e) => {

        // here, e.target represents the actual element (the <input/>) that triggered the event.
        // The element has several properties, including 'name' attribute and it's 'value'.
        const { name, value } = e.target;

        // The ... (spread operator) acts like a shallow clone. It says: "Take every key-value pair currently inside formData and copy them into this new object.
        // Why? If you have firstName, lastName, and email in your state, and you only updated email, the other two would be deleted if you didn't "spread" them back in.
        setFormData({
            ...formData,
            [name]: value,
        });
        // In above line, It copies everything from the old data, and then if the [name] matches an existing key (like email), it overwrites that specific value with the new one.
        // The [name] is like a generic object.
    };


    return (

        <div>
            <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First Name"
            />

            <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last Name"
            />

            <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
            />


            <div style={{ marginTop: '10px', padding: '10px', background: '#f0f0f0' }}>
                <strong>Name:</strong> {formData.firstName} {formData.lastName}
                <br />
                <strong>Email:</strong> {formData.email}
            </div>
            <div>

                <label>
                    <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setIsChecked(e.target.checked)}
                    />
                    {' '}I agree to the terms and conditions
                </label>
                <p>Status: {isChecked ? '✅ Agreed' : '❌ Not agreed'}</p>
            </div>

            <div>
                <h4>Select your gender:</h4>
                <label>
                    <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={selectedGender === 'male'}
                        onChange={(e) => setSelectedGender(e.target.value)}
                    />
                    {' '}Male
                </label>

                <label style={{ marginLeft: '10px' }}>
                    <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={selectedGender === 'female'}
                        onChange={(e) => setSelectedGender(e.target.value)}
                    />
                    {' '}Female
                </label>
            </div>

        </div>

    )







}