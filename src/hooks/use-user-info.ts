import { useEffect, useState } from 'react';

// Define a estrutura das informações do usuário
export interface UserInfo {
  name?: string;
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  profession?: string;
  location?: string;
  contact?: string;
}

const USER_INFO_KEY = 'chat_user_info';

export function useUserInfo() {
  const [userInfo, setUserInfo] = useState<UserInfo>({});

  // Efeito para carregar os dados do localStorage na primeira vez
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(USER_INFO_KEY);
      if (item) {
        setUserInfo(JSON.parse(item));
      }
    } catch (error) {
      console.error("Failed to load user info from localStorage", error);
    }
  }, []);

  // Função para salvar os dados no estado e no localStorage
  const saveUserInfo = (newInfo: Partial<UserInfo>) => {
    const updatedInfo = { ...userInfo, ...newInfo };
    setUserInfo(updatedInfo);
    try {
      window.localStorage.setItem(USER_INFO_KEY, JSON.stringify(updatedInfo));
    } catch (error) {
      console.error("Failed to save user info to localStorage", error);
    }
  };

  return { userInfo, saveUserInfo };
} 