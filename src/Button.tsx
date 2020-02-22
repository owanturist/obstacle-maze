import styled from 'styled-components';

export interface Props {
    block?: boolean;
}

const Button = styled.button.attrs({
    type: 'button',
    tabIndex: 0
})<Props>`
    box-sizing: border-box;
    display: ${props => props.block ? 'block' : 'inline-block'};
    padding: 10px 20px;
    width: ${props => props.block && '100%'};
    background: #eee;
    border: none;
    outline: none;
    cursor: pointer;

    &:disabled {
        cursor: default;
    }
`;

export default Button;
