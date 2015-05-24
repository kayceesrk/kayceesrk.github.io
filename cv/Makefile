all:
	pdflatex "\def\genrefs{0} \input{cv.tex}"
	pdflatex "\def\genrefs{0} \input{cv.tex}"
	mv cv.pdf cv_with_ref.pdf
	pdflatex cv
	pdflatex cv

clean:
	rm -f *~ *.aux *.out *.log
