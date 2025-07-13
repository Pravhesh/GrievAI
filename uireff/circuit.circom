
template Identity() {
    signal input in;
    signal output out;

    out <== in;
}

component main = Identity();
