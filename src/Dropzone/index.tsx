import React from 'react';
import styled from 'styled-components';
import ReactDropzone from 'react-dropzone';
import Maybe, { Nothing } from 'frctl/Maybe';

const StyledRoot = styled.div`
    background: #ccc;
`;

const Dropzone: React.FC<{
    onLoad(file: Maybe<File>): void;
}> = ({ onLoad }) => (
    <ReactDropzone
        accept="text/plain"
        multiple={false}
        onDropAccepted={files => onLoad(Maybe.fromNullable(files[ 0 ]))}
        onDropRejected={() => onLoad(Nothing)}
    >
        {({ getRootProps, getInputProps }) => (
            <StyledRoot {...getRootProps()}>
                <input {...getInputProps()}/>
                <p>Drag 'n' drop some files here, or click to select files</p>
            </StyledRoot>
        )}
    </ReactDropzone>
)

export default Dropzone;
