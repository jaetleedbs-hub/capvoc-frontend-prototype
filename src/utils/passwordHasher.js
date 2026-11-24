// utils/passwordHasher.js (또는 utils/passwordHasher.ts)

/**
 * 암호학적으로 안전한 무작위 솔트(Salt)를 생성합니다.
 * @param {number} length 솔트의 바이트 길이 (권장: 16바이트 이상)
 * @returns {Uint8Array} 생성된 솔트 (Uint8Array 형태)
 */
export function generateSalt(length = 16) { // 16바이트 = 128비트 솔트
    return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * 주어진 비밀번호를 SHA-256 및 PBKDF2를 사용하여 해싱합니다.
 * 이 함수는 복호화가 불가능하며, 비밀번호 저장에 적합합니다.
 *
 * @param {string} password 해싱할 원본 비밀번호
 * @param {Uint8Array} salt 해싱에 사용할 솔트 (generateSalt 함수로 생성)
 * @param {number} iterations PBKDF2 반복 횟수 (보안 강도 및 성능에 따라 조절, 최소 100,000 이상 권장)
 * @returns {Promise<{hash: string, salt: string}>} 해싱된 16진수 비밀번호 해시와 사용된 솔트(Base64)를 포함하는 객체
 */
export async function hashPassword(password, salt, iterations = 100000) {
    // 텍스트를 UTF-8 인코딩된 바이트 배열로 변환
    const passwordBuffer = new TextEncoder().encode(password);

    // 비밀번호를 CryptoKey 객체로 임포트 (raw 포맷)
    const passwordKey = await crypto.subtle.importKey(
        "raw",
        passwordBuffer,
        { name: "PBKDF2" },
        false, // exportable: false (키 내보내기 비활성화)
        ["deriveBits"] // deriveBits 권한만 필요
    );

    // PBKDF2를 사용하여 키(여기서는 해시) 파생
    const hashBuffer = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: iterations,
            hash: "SHA-256", // PBKDF2 내부 해싱 알고리즘
        },
        passwordKey,
        256 // 파생될 키의 비트 길이 (SHA-256 출력과 동일하게 256비트)
    );

    // 해시 바이트 배열을 Array로 변환
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // 각 바이트를 16진수 문자열로 변환하고 이어 붙임
    const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 솔트를 Base64로 인코딩하여 저장 및 재사용 용이하게 함
    const saltBase64 = btoa(String.fromCharCode.apply(null, salt));

    return { hash: hexHash, salt: saltBase64 };
}

/**
 * 저장된 해시된 비밀번호와 입력된 비밀번호가 일치하는지 검증합니다.
 *
 * @param {string} inputPassword 사용자가 입력한 비밀번호
 * @param {string} storedHash 데이터베이스에 저장된 비밀번호 해시 (16진수 문자열)
 * @param {string} storedSalt 데이터베이스에 저장된 솔트 (Base64 문자열)
 * @param {number} iterations PBKDF2 반복 횟수 (비밀번호를 해싱할 때 사용된 동일한 값)
 * @returns {Promise<boolean>} 비밀번호가 일치하면 true, 아니면 false
 */
export async function verifyPassword(inputPassword, storedHash, storedSalt, iterations = 100000) {
    // 저장된 솔트(Base64)를 Uint8Array로 디코딩
    const saltBuffer = Uint8Array.from(atob(storedSalt), c => c.charCodeAt(0));

    // 입력된 비밀번호를 동일한 솔트와 반복 횟수로 다시 해싱
    const { hash: newHash } = await hashPassword(inputPassword, saltBuffer, iterations);

    // 새로 해싱된 비밀번호와 저장된 해시를 비교 (시간 공격 방지를 위해 상수 시간 비교 사용 권장)
    // 이 예시에서는 간단한 문자열 비교를 사용합니다. 실제로는 crypto.subtle.timingSafeEqual 사용
    return newHash === storedHash;
}

// --- React 컴포넌트에서 사용 예시 (이 코드는 실제 유틸리티 파일에는 포함하지 않습니다) ---
/*
import React, { useState } from 'react';
import { generateSalt, hashPassword, verifyPassword } from './utils/passwordHasher'; // 실제 경로에 맞게 조정

function PasswordForm() {
    const [password, setPassword] = useState('');
    const [storedHash, setStoredHash] = useState('');
    const [storedSalt, setStoredSalt] = useState('');
    const [message, setMessage] = useState('');

    const handleRegister = async () => {
        if (!password) {
            setMessage('비밀번호를 입력해주세요.');
            return;
        }
        const salt = generateSalt();
        const { hash, salt: b64Salt } = await hashPassword(password, salt);
        setStoredHash(hash);
        setStoredSalt(b64Salt);
        setMessage('비밀번호가 해시되어 저장되었습니다!');
        console.log('저장된 해시:', hash, '솔트:', b64Salt);
    };

    const handleLogin = async () => {
        if (!password) {
            setMessage('비밀번호를 입력해주세요.');
            return;
        }
        if (!storedHash || !storedSalt) {
            setMessage('먼저 비밀번호를 등록해주세요.');
            return;
        }

        const isValid = await verifyPassword(password, storedHash, storedSalt);
        if (isValid) {
            setMessage('로그인 성공! 비밀번호가 일치합니다.');
        } else {
            setMessage('로그인 실패! 비밀번호가 일치하지 않습니다.');
        }
    };

    return (
        <div>
            <h2>비밀번호 관리</h2>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
            />
            <button onClick={handleRegister}>비밀번호 등록</button>
            <button onClick={handleLogin}>로그인</button>
            <p>{message}</p>
            {storedHash && <p>저장된 해시 (예시): {storedHash.substring(0, 20)}...</p>}
        </div>
    );
}

export default PasswordForm;
*/
