import { c } from '../../../helpers/classNameHelpers';
import { isEqual } from 'lodash';
import { type SelectOption, type SelectProps } from './SelectProps';
import { useEffect, useRef, useState } from 'react';
import IconArrowDown from '../../Icon/IconArrowDown';
import IconClose from '../../Icon/IconClose';
import SelectOptionsList from './components/SelectOptionsList';
import { createPortal } from 'react-dom';
import { v4 as uuidv4 } from 'uuid';

import styles from './Select.module.css';
import Input from '../Imput/Input';

const selectInstances = new Map();

function filterOptionByText<T>(text: string) {
  return (option: SelectOption<T>): SelectOption<T> => {
    const nLabel = option.label.toLowerCase();
    const nText = text.toLowerCase();
    const visible = nLabel.includes(nText);

    let labelElement;
    if (visible) {
      const indexStart = nLabel.indexOf(nText);
      const indexEnd = indexStart + nText.length;

      const textStart = option.label.slice(0, indexStart);
      const text = option.label.slice(indexStart, indexEnd);
      const textEnd = option.label.slice(indexEnd);

      labelElement = (
        <>
          <span>{textStart}</span>
          <b>{text}</b>
          <span>{textEnd}</span>
        </>
      );
    }

    return Object.assign({}, option, { visible, labelElement });
  };
}

const useHideOnClickedOutside = ({
  setVisible,
  visible,
}: {
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  visible: boolean;
}): void => {
  // hide options list when clicked outside
  useEffect(() => {
    if (visible) {
      const handleDocumentClick = (): void => {
        setVisible(false);
      };
      document.addEventListener('click', handleDocumentClick);
      return () => {
        document.removeEventListener('click', handleDocumentClick);
      };
    }
  }, [setVisible, visible]);
};

const useHideOnTriggerDOMRectChange = ({
  setVisible,
  visible,
  triggerDOMRect,
  triggerRef,
}: {
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  triggerDOMRect?: DOMRect;
  triggerRef: React.RefObject<HTMLInputElement>;
  visible: boolean;
}): void => {
  useEffect(() => {
    if (visible && triggerDOMRect && triggerRef.current) {
      const intervalId = setInterval(() => {
        const newTriggerDOMRect = triggerRef.current && triggerRef.current.getBoundingClientRect();

        if (
          visible &&
          triggerDOMRect &&
          newTriggerDOMRect &&
          (newTriggerDOMRect.top !== triggerDOMRect.top ||
            newTriggerDOMRect.left !== triggerDOMRect.left ||
            newTriggerDOMRect.width !== triggerDOMRect.width ||
            newTriggerDOMRect.height !== triggerDOMRect.height ||
            newTriggerDOMRect.bottom !== triggerDOMRect.bottom)
        ) {
          setVisible(false);
        }
      }, 10);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [setVisible, triggerDOMRect, triggerRef, visible]);
};

function useKeyboardNavigation<T>({
  visible,
  selectedIndex,
  filteredOptions,
  handleOnChange,
  handleOnInputClick,
}: {
  visible: boolean;
  selectedIndex?: number;
  filteredOptions: SelectOption<T>[];
  handleOnChange: (index: number) => void;
  handleOnInputClick: (event: React.MouseEvent<HTMLInputElement>) => void;
}) {
  const [focusedItemIndex, setFocusedItemIndex] = useState<number>();

  useEffect(() => {
    if (!visible) {
      setFocusedItemIndex(undefined);
    }
  }, [visible]);

  useEffect(() => {
    setFocusedItemIndex(undefined);
  }, [filteredOptions]);

  const handleOnInputKeyDownCapture = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (visible) {
      const focusedIndex = focusedItemIndex ?? selectedIndex ?? -1;

      const nextIndex = filteredOptions.findIndex(
        ({ visible }, index) => visible !== false && index > focusedIndex
      );
      if (event.code === 'ArrowDown' && nextIndex >= 0) {
        event.preventDefault();
        setFocusedItemIndex(nextIndex);
      }

      const prevIndex = filteredOptions.reduce((lastIndex, { visible }, index) => {
        if (visible !== false && index < focusedIndex && lastIndex < index) {
          return index;
        }
        return lastIndex;
      }, -1);
      if (event.code === 'ArrowUp' && prevIndex >= 0) {
        event.preventDefault();
        setFocusedItemIndex(prevIndex);
      }

      if (event.code === 'Enter' && focusedItemIndex != null) {
        event.preventDefault();
        handleOnChange(focusedItemIndex);
      }
    } else {
      if (event.code === 'Enter' || event.code === 'ArrowDown') {
        event.preventDefault();
        handleOnInputClick(event as any);
      }
    }
  };

  return { handleOnInputKeyDownCapture, focusedItemIndex, setFocusedItemIndex };
}

function Select<T>({
  className = '',
  cleanable = false,
  disabled = false,
  noResultsElement,
  onChange,
  options,
  placeholder = '',
  searchable = false,
  value,
  triggerElementRef,
}: SelectProps<T>): JSX.Element {
  const [id] = useState<string>(uuidv4());
  const newTriggerRef = useRef<HTMLInputElement>(null);
  const triggerRef = triggerElementRef ?? newTriggerRef;
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>();
  const [visible, setVisible] = useState<boolean>(false);
  const [triggerDOMRect, setTriggerDOMRect] = useState<DOMRect>();
  const [filteredOptions, setFilteredOptions] = useState<SelectOption<T>[]>(options);

  useEffect(() => {
    selectInstances.set(id, {
      setVisible,
    });
    return () => {
      selectInstances.delete(id);
    };
  }, [id]);

  // set filtered options when options changes
  useEffect(() => {
    setFilteredOptions(options);
  }, [options]);

  // set selected label and index when value changes
  useEffect(() => {
    const index = options.findIndex(option => isEqual(option.value, value));
    if (index >= 0) {
      const { label } = options[index];
      setSelectedLabel(label);
      setSelectedIndex(index);
    }
  }, [value, options]);

  const handleOnChange = (index: number): void => {
    const { value, label } = options[index];
    setSelectedLabel(label);
    setSelectedIndex(index);
    setVisible(false);
    onChange && onChange(value);

    setTimeout(() => {
      setFilteredOptions(options);
    }, 1000);
  };

  const handleOnClean = (): void => {
    if (selectedLabel) {
      setSelectedLabel('');
      setSelectedIndex(undefined);
      onChange && onChange(undefined);
      setFilteredOptions(options);
    }
  };

  const handleOnInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const text = event.target.value ?? '';
    setSelectedLabel(text);
    setSelectedIndex(undefined);

    if (text.trim() === '') {
      setFilteredOptions(options);
    } else {
      const data = options.map(filterOptionByText<T>(text));
      setFilteredOptions(data);
      setVisible(true);
    }
  };

  const handleOnInputBlur = (): void => {
    if (selectedIndex != null && selectedIndex >= 0) {
      const { label } = options[selectedIndex];
      setSelectedLabel(label);
    }
  };

  const handleOnInputClick = (event: React.MouseEvent<HTMLInputElement>) => {
    if (!disabled && triggerRef.current) {
      event.stopPropagation();

      // hide other select instances
      selectInstances.forEach((instance, key) => {
        if (key !== id) {
          instance.setVisible(false);
        }
      });

      setVisible(true);
      setTriggerDOMRect(triggerRef.current.getBoundingClientRect());
    }
  };

  const { focusedItemIndex, setFocusedItemIndex, handleOnInputKeyDownCapture } =
    useKeyboardNavigation({
      visible,
      selectedIndex,
      filteredOptions,
      handleOnChange,
      handleOnInputClick,
    });

  // hide options list when disabled
  useEffect(() => {
    if (disabled) {
      setVisible(false);
    }
  }, [disabled]);

  useHideOnClickedOutside({ setVisible, visible });

  useHideOnTriggerDOMRectChange({
    setVisible,
    triggerDOMRect,
    triggerRef,
    visible,
  });

  return (
    <div
      className={c(
        className,
        styles.select,
        disabled ? styles.disabled : '',
        cleanable ? styles.cleanable : ''
      )}
    >
      <div className={c(styles.controls)}>
        <div>
          <Input
            ref={triggerRef}
            className={c(styles.trigger)}
            disabled={disabled}
            onChange={handleOnInputChange}
            onBlur={handleOnInputBlur}
            onKeyDownCapture={handleOnInputKeyDownCapture}
            onClick={handleOnInputClick}
            placeholder={placeholder}
            readOnly={!searchable}
            value={selectedLabel}
          />
          <IconArrowDown className={c(styles.trigger_icon)} />
        </div>
        {cleanable && (
          <button className={c(styles.cleaner)} onClick={handleOnClean}>
            <IconClose className={c(styles.cleaner_icon)} />
          </button>
        )}
      </div>

      {createPortal(
        <SelectOptionsList
          noResultsElement={noResultsElement}
          onChange={handleOnChange}
          options={filteredOptions}
          selectedIndex={selectedIndex}
          focusedIndex={focusedItemIndex}
          setFocusedItemIndex={setFocusedItemIndex}
          triggerDOMRect={triggerDOMRect}
          visible={visible}
        />,
        document.body,
        id
      )}
    </div>
  );
}

export default Select;
