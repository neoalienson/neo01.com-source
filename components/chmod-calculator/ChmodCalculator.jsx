import React, { useState, useCallback, useMemo } from 'react';
import { ToolLayout } from '../ToolLayout.jsx';
import { CopyButton } from '../CopyButton.jsx';

const translations = {
  en: {
    title: "Chmod Calculator",
    filePermissions: "File Permissions:",
    owner: "Owner",
    group: "Group",
    others: "Others",
    read: "Read",
    write: "Write",
    execute: "Execute",
    octalNotation: "Octal Notation",
    symbolicNotation: "Symbolic Notation",
    umask: "Umask",
    orEnterOctal: "Or enter octal value:",
    copy: "Copy",
    copied: "Copied!",
    about: "About Chmod Calculator",
    description: "Chmod Calculator helps you understand and generate Unix/Linux file permission codes. File permissions control who can read, write, or execute files on unix-based systems.",
    howItWorks: "How It Works",
    howItWorksText: "Unix permissions are divided into three groups: owner, group, and others. Each group can have read (4), write (2), and execute (1) permissions. The octal notation sums these values for each group, resulting in a three-digit number.",
    commonUseCases: "Common Use Cases",
    useCase1: "Web server files (typically 644 for files, 755 for directories)",
    useCase2: "SSH keys (600 for private keys)",
    useCase3: "Deploying applications with correct executable permissions",
    useCase4: "Troubleshooting permission-denied errors",
    tip: "Tip: Check or uncheck the permission boxes to see the octal and symbolic notations update in real-time. You can also enter an octal value directly."
  },
  "zh-CN": {
    title: "chmod 计算器",
    filePermissions: "文件权限：",
    owner: "所有者",
    group: "组",
    others: "其他",
    read: "读取",
    write: "写入",
    execute: "执行",
    octalNotation: "八进制表示",
    symbolicNotation: "符号表示",
    umask: "Umask",
    orEnterOctal: "或输入八进制值：",
    copy: "复制",
    copied: "已复制！",
    about: "关于 chmod 计算器",
    description: "chmod 计算器帮助您理解和生成 Unix/Linux 文件权限代码。文件权限控制谁可以读取、写入或执行 unix 系统上的文件。",
    howItWorks: "工作原理",
    howItWorksText: "Unix 权限分为三组：所有者、组和其他。每组可以有读取 (4)、写入 (2) 和执行 (1) 权限。八进制表示法将每组的这些值相加，得到一个三位数。",
    commonUseCases: "常见用例",
    useCase1: "Web 服务器文件（通常文件为 644，目录为 755）",
    useCase2: "SSH 密钥（私钥为 600）",
    useCase3: "部署具有正确可执行权限的应用程序",
    useCase4: "排查权限被拒绝错误",
    tip: "提示：勾选或取消勾选权限框可实时查看八进制和符号表示法的更新。您也可以直接输入八进制值。"
  },
  "zh-TW": {
    title: "chmod 計算器",
    filePermissions: "檔案權限：",
    owner: "所有者",
    group: "群組",
    others: "其他",
    read: "讀取",
    write: "寫入",
    execute: "執行",
    octalNotation: "八進制表示",
    symbolicNotation: "符號表示",
    umask: "Umask",
    orEnterOctal: "或輸入八進制值：",
    copy: "複製",
    copied: "已複製！",
    about: "關於 chmod 計算器",
    description: "chmod 計算器幫助您理解和生成 Unix/Linux 檔案權限代碼。檔案權限控制誰可以讀取、寫入或執行 unix 系統上的檔案。",
    howItWorks: "工作原理",
    howItWorksText: "Unix 權限分為三組：所有者、群組和其他。每組可以有讀取 (4)、寫入 (2) 和執行 (1) 權限。八進制表示法將每組的這些值相加，得到一個三位數。",
    commonUseCases: "常見用例",
    useCase1: "Web 服務器檔案（通常檔案為 644，目錄為 755）",
    useCase2: "SSH 密鑰（私鑰為 600）",
    useCase3: "部署具有正確可執行權限的應用程序",
    useCase4: "排查權限被拒絕錯誤",
    tip: "提示：勾選或取消勾選權限框可即時查看八進制和符號表示法的更新。您也可以直接輸入八進制值。"
  }
};

function t(key, locale = 'en') {
  const trans = translations[locale] || translations.en;
  const keys = key.split('.');
  let value = trans;
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}

function calculateOctal(permissions) {
  const owner = permissions.owner;
  const group = permissions.group;
  const others = permissions.others;

  const ownerVal = (owner.read ? 4 : 0) + (owner.write ? 2 : 0) + (owner.execute ? 1 : 0);
  const groupVal = (group.read ? 4 : 0) + (group.write ? 2 : 0) + (group.execute ? 1 : 0);
  const othersVal = (others.read ? 4 : 0) + (others.write ? 2 : 0) + (others.execute ? 1 : 0);

  return `${ownerVal}${groupVal}${othersVal}`;
}

function calculateSymbolic(permissions) {
  const getSymbolic = (p) => {
    return (p.read ? 'r' : '-') + (p.write ? 'w' : '-') + (p.execute ? 'x' : '-');
  };
  return getSymbolic(permissions.owner) + getSymbolic(permissions.group) + getSymbolic(permissions.others);
}

function calculateUmask(octal) {
  return octal.split('').map(d => 7 - parseInt(d)).join('');
}

export function ChmodCalculator({ locale = 'en' }) {
  const [permissions, setPermissions] = useState({
    owner: { read: true, write: true, execute: false },
    group: { read: true, write: false, execute: false },
    others: { read: true, write: false, execute: false }
  });

  const [numericInput, setNumericInput] = useState('');

  const octal = useMemo(() => calculateOctal(permissions), [permissions]);
  const symbolic = useMemo(() => calculateSymbolic(permissions), [permissions]);
  const umask = useMemo(() => calculateUmask(octal), [octal]);

  const handleCheckboxChange = useCallback((group, permission, checked) => {
    setPermissions(prev => ({
      ...prev,
      [group]: {
        ...prev[group],
        [permission]: checked
      }
    }));
  }, []);

  const handleNumericInputChange = useCallback((e) => {
    const value = e.target.value;
    setNumericInput(value);

    if (/^[0-7]{1,3}$/.test(value)) {
      const paddedValue = value.padStart(3, '0');
      const types = ['owner', 'group', 'others'];

      setPermissions(
        paddedValue.split('').reduce((acc, digit, index) => {
          const d = parseInt(digit);
          acc[types[index]] = {
            read: (d & 4) !== 0,
            write: (d & 2) !== 0,
            execute: (d & 1) !== 0
          };
          return acc;
        }, {})
      );
    }
  }, []);

  const PermissionCheckbox = ({ group, permission }) => (
    <input
      type="checkbox"
      checked={permissions[group][permission]}
      onChange={(e) => handleCheckboxChange(group, permission, e.target.checked)}
    />
  );

  const PermissionGroup = ({ group }) => (
    <div className="permission-checkboxes">
      <PermissionCheckbox group={group} permission="read" />
    </div>
  );

  return (
    <ToolLayout title={t('title', locale)}>
      <div className="tool_main">
        <div className="input-group">
          <label>{t('filePermissions', locale)}</label>
          <div className="permission-grid">
            <div></div>
            <div className="permission-header">{t('owner', locale)}</div>
            <div className="permission-header">{t('group', locale)}</div>
            <div className="permission-header">{t('others', locale)}</div>

            <div className="permission-label">{t('read', locale)}</div>
            <PermissionGroup group="owner" />
            <PermissionGroup group="group" />
            <PermissionGroup group="others" />

            <div className="permission-label">{t('write', locale)}</div>
            <div className="permission-checkboxes">
              <PermissionCheckbox group="owner" permission="write" />
            </div>
            <div className="permission-checkboxes">
              <PermissionCheckbox group="group" permission="write" />
            </div>
            <div className="permission-checkboxes">
              <PermissionCheckbox group="others" permission="write" />
            </div>

            <div className="permission-label">{t('execute', locale)}</div>
            <div className="permission-checkboxes">
              <PermissionCheckbox group="owner" permission="execute" />
            </div>
            <div className="permission-checkboxes">
              <PermissionCheckbox group="group" permission="execute" />
            </div>
            <div className="permission-checkboxes">
              <PermissionCheckbox group="others" permission="execute" />
            </div>
          </div>
        </div>

        <div className="output-section">
          <CopyButton text={octal} locale={locale} />
          <div className="output-label">{t('octalNotation', locale)}</div>
          <div className="output-content" id="octal-result">{octal}</div>
        </div>

        <div className="output-section">
          <CopyButton text={symbolic} locale={locale} />
          <div className="output-label">{t('symbolicNotation', locale)}</div>
          <div className="output-content" id="symbolic-result">{symbolic}</div>
        </div>

        <div className="output-section">
          <CopyButton text={umask} locale={locale} />
          <div className="output-label">{t('umask', locale)}</div>
          <div className="output-content" id="umask-result">{umask}</div>
        </div>

        <div className="input-group">
          <label htmlFor="numericInput">{t('orEnterOctal', locale)}</label>
          <input
            type="text"
            id="numericInput"
            className="numeric-input"
            value={numericInput}
            onChange={handleNumericInputChange}
            placeholder="644"
            maxLength={3}
          />
        </div>
      </div>

      <div className="info-section">
        <h2>{t('about', locale)}</h2>
        <p>{t('description', locale)}</p>

        <h3>{t('howItWorks', locale)}</h3>
        <p>{t('howItWorksText', locale)}</p>

        <h3>{t('commonUseCases', locale)}</h3>
        <ul>
          <li>{t('useCase1', locale)}</li>
          <li>{t('useCase2', locale)}</li>
          <li>{t('useCase3', locale)}</li>
          <li>{t('useCase4', locale)}</li>
        </ul>

        <p>{t('tip', locale)}</p>
      </div>
    </ToolLayout>
  );
}

export { calculateOctal, calculateSymbolic, calculateUmask };