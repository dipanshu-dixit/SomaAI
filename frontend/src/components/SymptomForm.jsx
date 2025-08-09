import React from 'react';
import styles from './SymptomForm.module.css';

function SymptomForm() {
    return (
        <div className={styles.container}>
            <label className={styles.label}>Describe your symptoms:</label>
            <input className={styles.input} type="text" placeholder="Chest pain, anxiety, etc..." />
            <button className={styles.button}>Analyze</button>
        </div>
    );
}

export default SymptomForm;